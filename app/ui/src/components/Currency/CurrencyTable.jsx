import {
  MaterialReactTable, MRT_ShowHideColumnsButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
// Custom components and libraries
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import { useErrorNotification } from "../../hooks/useAppNotifications";
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import { fetchCurrency } from '../../util/http/currency';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import { useDialogs } from '@toolpad/core/useDialogs';
import { evaluateCurrency, formatCurrencyValue, metricOptions, timeframeUnitOptions } from './helpers';
import NewCurrencyButton from './NewCurrencyButton';
import EditCurrencyButton from './EditCurrencyButton';
import DeleteCurrencyButton from './DeleteCurrencyButton';
import { fetchLogbookData } from '../../util/http/logbook';
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
  enableRowActions: true,
}

export const CurrencyTable = () => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const navigate = useNavigate();
  const dialogs = useDialogs();

  // load all data
  const { data: logbookData, isLoading: isLogbookDataLoading, isError: isLogbookDataError, error: logbookDataError } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isLogbookDataError, logbookDataError, fallbackMessage: 'Failed to load logbook data' });

  const { data: modelsData } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['currency'],
    queryFn: ({ signal }) => fetchCurrency({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load currencies' });

  const columns = useMemo(() => [
    { accessorKey: "name", header: "Name", size: 200 },
    {
      accessorKey: "metric", header: "Metric", size: 140,
      Cell: ({ cell }) => {
        const metricValue = cell.getValue();
        const option = metricOptions.find(opt => opt.value === metricValue);
        return option ? option.label : metricValue;
      }
    },
    { accessorKey: "comparison", header: "Comparison", size: 130 },
    { accessorKey: "target_value", header: "Target", size: 110 },
    {
      id: "time_frame_combined",
      header: "Time Frame",
      size: 200,
      accessorFn: (row) => ({ unit: row.time_frame?.unit, value: row.time_frame?.value }),
      Cell: ({ cell }) => {
        const data = cell.getValue();
        const unitOption = timeframeUnitOptions.find(opt => opt.value === data.unit);
        const unitLabel = unitOption ? unitOption.label : data.unit;
        return `${data.value} ${unitLabel}`;
      }
    },
    { accessorKey: "filters", header: "Filters", size: 120 },
    {
      id: "status", header: "Status", grow: true,
      accessorFn: (row) => {
        return evaluateCurrency(logbookData, row, modelsData);
      },
      Cell: ({ cell }) => {
        const data = cell.getValue();
        return (
          <Chip size='small'
            label={formatCurrencyValue(data?.current, data?.rule.metric)}
            color={data?.meetsRequirement ? 'success' : 'error'}
          />
        )
      }
    }
  ], [logbookData, modelsData, data]);

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

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    return (
      <>
        <EditCurrencyButton payload={payload} />
        <DeleteCurrencyButton payload={payload} />
      </>
    );
  }, []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility, columnSizing: columnSizing },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    renderToolbarInternalActions: renderToolbarInternalActions,
    renderRowActions: renderRowActions,
    ...tableOptions
  });

  return (
    <>
      {(isLoading || isLogbookDataLoading) && <LinearProgress />}
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} />
    </>
  );
}

export default CurrencyTable;