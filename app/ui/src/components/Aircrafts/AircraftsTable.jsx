import { MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton, MRT_ToggleFullScreenButton, MRT_ToggleGlobalFilterButton, useMaterialReactTable } from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import { fetchAircrafts } from "../../util/http/aircraft";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import EditCustomCategoriesModal from './EditCustomCategoriesModal';
import { useDialogs } from '@toolpad/core/useDialogs';

const paginationKey = 'aircrafts-table-page-size';
const columnVisibilityKey = 'aircrafts-table-column-visibility';
const columnSizingKey = 'aircrafts-table-column-sizing';

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

export const AircraftsTable = ({ ...props }) => {
  const dialogs = useDialogs();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });
  const filterFns = useMemo(() => ({ dateFilterFn: dateFilterFn }), []);

  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load aircrafts' });

  const columns = useMemo(() => [
    { accessorKey: "reg", header: "Registration", size: 120 },
    { accessorKey: "model", header: "Type", size: 110 },
    { accessorKey: "category", header: "Category", grow: true },
  ], []);

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    return (
      <Tooltip title="Edit Custom Category">
        <IconButton onClick={async () => await dialogs.open(EditCustomCategoriesModal, payload)}>
          <EditOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    );
  }, [dialogs, EditCustomCategoriesModal]);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton table={table} type="aircrafts" />
    </Box>
  ), []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const filterDrawOpen = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const filterDrawClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: filterDrawOpen,
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    renderToolbarInternalActions: renderToolbarInternalActions,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
    renderRowActions: renderRowActions,
    state: { pagination, columnFilters: columnFilters, columnVisibility, columnSizing },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    ...tableOptions
  });

  return (
    <>
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} {...props} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
}

export default AircraftsTable;