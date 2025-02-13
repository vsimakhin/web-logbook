import { MaterialReactTable, useMaterialReactTable, MRT_TableHeadCellFilterContainer, MRT_ExpandAllButton } from 'material-react-table';
import { useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import { tableJSONCodec } from '../../constants/constants';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAircraftModelsCategories } from '../../util/http/aircraft';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import EditCategoriesModal from './EditCategoriesModal';
import CSVCategoriesExportButton from './CSVCategoriesExportButton';

const paginationKey = 'categories-table-page-size';
const columnVisibilityKey = 'categories-table-column-visibility';

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

export const CategoriesTable = ({ ...props }) => {
  const dialogs = useDialogs();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });

  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load categories' });

  const columns = useMemo(() => [
    { accessorKey: "model", header: "Type", size: 130 },
    { accessorKey: "category", header: "Category", grow: true },
  ], []);

  const renderRowActions = ({ row }) => {
    const payload = row.original;
    return (
      <Tooltip title="Edit Category">
        <IconButton onClick={async () => await dialogs.open(EditCategoriesModal, payload)}>
          <EditOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    );
  }

  const table = useMaterialReactTable({
    isLoading: isLoading,
    columns: columns,
    data: data ?? [],
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <CSVCategoriesExportButton table={table} />
      </Box>
    ),
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility },
    defaultColumn: {
      muiFilterTextFieldProps: ({ column }) => ({ label: `Filter by ${column.columnDef.header}` }),
    },
    renderRowActions: renderRowActions,
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

export default CategoriesTable;