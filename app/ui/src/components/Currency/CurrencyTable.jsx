import {
  MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { CURRENCY_INITIAL_STATE, defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import { fetchCurrency } from '../../util/http/currency';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import { useDialogs } from '@toolpad/core/useDialogs';
import CurrencyModal from './CurrencyModal';
import { metricOptions, timeframeUnitOptions } from './helpers';

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
  const filterFns = useMemo(() => ({ dateFilterFn: dateFilterFn }), []);

  const navigate = useNavigate();
  const dialogs = useDialogs();

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
    { accessorKey: "target_value", header: "Target Value", size: 150 },
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

    { accessorKey: "filters", header: "Filters", size: 200 },
  ], []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <Tooltip title="New Currency">
        <IconButton onClick={async () => await dialogs.open(CurrencyModal, CURRENCY_INITIAL_STATE)}>
          <AddBoxOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </Box>
  ), []);

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    console.log(payload);
    return (
      <Tooltip title="Edit Currency">
        <IconButton onClick={async () => await dialogs.open(CurrencyModal, payload)}>
          <EditOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    );
  }, []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    filterFns: filterFns,
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
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} />
    </>
  );
}

export default CurrencyTable;