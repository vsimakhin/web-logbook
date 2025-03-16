import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
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
import { fetchCustomAirports } from '../../util/http/airport';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import EditCustomAirportButton from './EditCustomAirportButton';
import DeleteCustomAirportButton from './DeleteCustomAirportButton';
import AddCustomAirportButton from './AddCustomAirportButton';

const paginationKey = 'custom-airports-table-page-size';
const columnVisibilityKey = 'custom-airports-table-column-visibility';

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

export const CustomAirportsTable = () => {
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['custom-airports'],
    queryFn: ({ signal }) => fetchCustomAirports({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load airports' });

  const columns = useMemo(() => [
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
      <>
        <EditCustomAirportButton payload={payload} />
        <DeleteCustomAirportButton payload={payload} />
      </>
    );
  }, []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <AddCustomAirportButton />
      <CSVExportButton table={table} type="custom-airports" />
    </Box>
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
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    renderRowActions: renderRowActions,
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    ...tableOptions
  });

  return (
    <>
      <CardHeader title="Custom Airports" />
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
}

export default CustomAirportsTable;