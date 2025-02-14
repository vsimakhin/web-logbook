import { MaterialReactTable, useMaterialReactTable, MRT_TableHeadCellFilterContainer, MRT_ExpandAllButton } from 'material-react-table';
import { useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import { defaultColumnFilterTextFieldProps, tableJSONCodec } from '../../constants/constants';
import { fetchAircrafts } from "../../util/http/aircraft";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';

const paginationKey = 'aircrafts-table-page-size';
const columnVisibilityKey = 'aircrafts-table-column-visibility';

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

export const AircraftsTable = ({ ...props }) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const filterFns = useMemo(() => ({ dateFilterFn: dateFilterFn }), []);

  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load aircrafts' });

  const columns = useMemo(() => [
    { accessorKey: "reg", header: "Registration", size: 120 },
    { accessorKey: "model", header: "Type", size: 110 },
    { accessorKey: "category", header: "Category", grow: true },
  ], []);

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <CSVExportButton table={table} type="aircrafts" />
      </Box>
    ),
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility },
    defaultColumn: { muiFilterTextFieldProps: defaultColumnFilterTextFieldProps },
    ...tableOptions
  });

  return (
    <>
      {isLoading && <LinearProgress />}
      <MaterialReactTable table={table} {...props} />
      <Drawer anchor="right" open={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} sx={{
        '& .MuiDrawer-paper': {
          marginTop: '64px',
          height: 'calc(100% - 64px)',
        },
      }}>
        <Box sx={{ width: 350, padding: 2 }}>
          {table.getLeafHeaders().map((header) => {
            if (header.id.startsWith('mrt-') || header.id.startsWith('Expire') || header.id.startsWith('center_1_')) return null;
            return < MRT_TableHeadCellFilterContainer key={header.id} header={header} table={table} in />
          })}
        </Box>
      </Drawer>
    </>
  );
}

export default AircraftsTable;