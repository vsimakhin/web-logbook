import {
  MaterialReactTable, MRT_ShowHideColumnsButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
// Custom components and libraries
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import { evaluateCurrency, formatCurrencyValue, metricOptions, timeframeUnitOptions, getCurrencyExpiryForRule } from './helpers';
import { calculateExpiry } from '../Licensing/helpers';
import dayjs from 'dayjs';
import NewCurrencyButton from './NewCurrencyButton';
import EditCurrencyButton from './EditCurrencyButton';
import DeleteCurrencyButton from './DeleteCurrencyButton';
import HelpButton from './HelpButton';

const paginationKey = 'currency-table-page-size';
const columnVisibilityKey = 'currency-table-column-visibility';
const columnSizingKey = 'currency-table-column-sizing';

const tableOptions = {
  initialState: { density: 'compact' },
  positionToolbarAlertBanner: 'bottom',
  groupedColumnMode: 'remove',
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: true,
  enableColumnDragging: false,
  enableColumnPinning: false,
  enableGrouping: true,
  enableDensityToggle: false,
  columnResizeMode: 'onEnd',
  muiTablePaperProps: { variant: 'outlined', elevation: 0 },
  columnFilterDisplayMode: 'custom',
  enableFacetedValues: true,
  enableSorting: true,
  enableColumnActions: true,
}

export const CurrencyTable = ({ logbookData, currencyData, aircrafts }) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const columns = useMemo(() => {
    return [
      {
        id: 'actions',
        header: 'Actions',
        size: 90,
        Cell: ({ row }) => (
          <>
            <EditCurrencyButton payload={row.original} />
            <DeleteCurrencyButton payload={row.original} />
          </>
        ),
      },
      { accessorKey: "name", header: "Name", size: 200 },
      {
        accessorKey: "metric", header: "Metric", size: 140,
        Cell: ({ cell }) => {
          const metricValue = cell.getValue();
          const option = metricOptions().find(opt => opt.value === metricValue);
          return option ? option.label : metricValue;
        }
      },
      { accessorKey: "comparison", header: "Comparison", size: 150 },
      { accessorKey: "target_value", header: "Target", size: 110 },
      {
        id: "time_frame_combined",
        header: "Time Frame",
        size: 200,
        accessorFn: (row) => ({ unit: row.time_frame?.unit, value: row.time_frame?.value, since: row.time_frame?.since }),
        Cell: ({ cell }) => {
          const cellData = cell.getValue();
          const unitOption = timeframeUnitOptions.find(opt => opt.value === cellData.unit);
          const unitLabel = unitOption ? unitOption.label : cellData.unit;

          if (cellData.unit === 'all_time') {
            return unitOption.label;
          } else if (cellData.unit === 'since') {
            return `Since ${cellData.since}`;
          } else if (cellData.value) {
            return `${cellData.value} ${unitLabel}`;
          }
        }
      },
      { accessorKey: "filters", header: "Filters", size: 120 },
      {
        id: "valid_until",
        header: "Valid Until",
        size: 160,
        accessorFn: (row) => getCurrencyExpiryForRule(logbookData, row, aircrafts),
        Cell: ({ cell }) => {
          const expiry = cell.getValue();
          return expiry ? dayjs(expiry).format('DD/MM/YYYY') : '—'
        }
      },
      {
        id: "expire",
        header: "Expire",
        size: 120,
        accessorFn: (row) => {
          const expiry = getCurrencyExpiryForRule(logbookData, row, aircrafts);
          row.expiry = expiry; // Cache for use in Cell
          if (!expiry) return null;
          const today = dayjs().startOf('day');
          return dayjs(expiry).startOf('day').diff(today, 'day');
        },
        Cell: ({ cell }) => {
          const days = cell.getValue();
          const row = cell.row.original;

          if (days === null || days === undefined) {
            // If we can't compute an expiry, still show "Expired" for time-based rules
            // when the rule does not meet the requirement in the current window.
            const res = evaluateCurrency(logbookData, row, aircrafts);
            const isDaysWindow = row?.time_frame?.unit === 'days';
            const isTimeMetric = typeof row?.metric === 'string' && row.metric.startsWith('time');
            if (isDaysWindow && isTimeMetric && res && res.meetsRequirement === false) {
              return (
                <Typography variant="body2" color={'error'}>Expired</Typography>
              );
            }
            return '—';
          }

          const expiryStr = dayjs(cell.row.original.expiry).format('DD/MM/YYYY');
          const exp = calculateExpiry(expiryStr);
          if (!exp) return '—';

          const text = exp.diffDays < 0
            ? 'Expired'
            : `${exp.months > 0 ? `${exp.months} month${exp.months === 1 ? '' : 's'} ` : ''}${exp.days} day${exp.days === 1 ? '' : 's'}`;
          // Currency-specific coloring: yellow in the last ~third of the window (≈30 days), red if expired
          const color = exp.diffDays < 0 ? 'error' : (exp.diffDays < 30 ? 'warning' : 'inherit');
          return (
            <Typography variant="body2" color={color}>{text}</Typography>
          );
        }
      },
      {
        id: "status", header: "Status", grow: true,
        accessorFn: (row) => {
          return evaluateCurrency(logbookData, row, aircrafts);
        },
        Cell: ({ cell }) => {
          const cellData = cell.getValue();
          return (
            <Chip size='small'
              label={formatCurrencyValue(cellData?.current, cellData?.rule.metric)}
              color={cellData?.meetsRequirement ? 'success' : 'error'}
            />
          )
        }
      },
    ]
  }, [logbookData, aircrafts]);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <HelpButton />
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <NewCurrencyButton />
  ), []);

  const table = useMaterialReactTable({
    // isLoading: (isLoading || isModelsDataLoading || isLogbookDataLoading),
    columns: columns,
    data: currencyData,
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility, columnSizing: columnSizing },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    renderToolbarInternalActions: renderToolbarInternalActions,
    ...tableOptions
  });

  return (
    <>
      {/* {(isLoading || isLogbookDataLoading || isModelsDataLoading) && <LinearProgress />} */}
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} />
    </>
  );
}

export default CurrencyTable;