import { MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton, MRT_ToggleFullScreenButton, MRT_ToggleGlobalFilterButton, useMaterialReactTable } from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import CardHeader from "../UIElements/CardHeader";
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchStandardAirports } from '../../util/http/airport';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import CopyAirportButton from './CopyAirportButton';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';

const paginationKey = 'standard-airports-table-page-size';
const columnVisibilityKey = 'standard-airports-table-column-visibility';
const columnSizingKey = 'standard-airports-table-column-sizing';

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

export const StandardAirportsTable = () => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['airports'],
    queryFn: ({ signal }) => fetchStandardAirports({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load airports' });

  const columns = useMemo(() => [
    { accessorKey: "icao", header: "ICAO", size: 100 },
    { accessorKey: "iata", header: "IATA", size: 100 },
    { accessorKey: "name", header: "Name", grow: true },
    { accessorKey: "city", header: "City", size: 120 },
    { accessorKey: "country", header: "Country", size: 70 },
    { accessorKey: "elevation", header: "Elevation", size: 70 },
    { accessorKey: "lat", header: "Lat", size: 70 },
    { accessorKey: "lon", header: "Lon", size: 70 },
  ], []);

  const renderRowActions = useCallback(({ row }) => {
    const payload = row.original;
    return (
      <CopyAirportButton payload={payload} />
    );
  }, []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <CSVExportButton table={table} type="airports" />
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
  ), [setColumnSizing]);

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
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    renderToolbarInternalActions: renderToolbarInternalActions,
    onPaginationChange: setPagination,
    renderRowActions: renderRowActions,
    state: { pagination, columnFilters: columnFilters, columnVisibility, columnSizing },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    ...tableOptions
  });

  return (
    <>
      <CardHeader title="Standard Airports" />
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
}

export default StandardAirportsTable;