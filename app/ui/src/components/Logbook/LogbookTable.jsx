import { MaterialReactTable, useMaterialReactTable, MRT_TableHeadCellFilterContainer } from 'material-react-table';
import { useEffect, useMemo, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
// Custom components and libraries
import { dateFilterFn, getFilterLabel, landingFilterFn, timeFilterFn } from './helpers';
import PDFExportButton from './PDFExportButton';
import CSVExportButton from './CSVExportButton';
import NewFlightRecordButton from './NewFlightRecordButton';

const tablePageKey = 'logbook-table-page-size';
const columnVisibilityKey = 'logbook-table-column-visibility';

export const LogbookTable = ({ columns, data, isLoading, ...props }) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const savedVisibility = localStorage.getItem(columnVisibilityKey);
    return savedVisibility ? JSON.parse(savedVisibility) : {};
  });

  const initialPageSize = useMemo(() => {
    return localStorage.getItem(tablePageKey) ? parseInt(localStorage.getItem(tablePageKey)) : 15;
  }, []);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  useEffect(() => {
    localStorage.setItem(tablePageKey, pagination.pageSize);
  }, [pagination.pageSize]);

  useEffect(() => {
    localStorage.setItem(columnVisibilityKey, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const filterFns = useMemo(() => ({
    dateFilterFn: dateFilterFn,
    timeFilterFn: timeFilterFn,
    landingFilterFn: landingFilterFn,
  }), []);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    initialState: { density: 'compact' },
    isLoading: isLoading,
    enableColumnResizing: true,
    enableGlobalFilterModes: true,
    enableColumnFilters: true,
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    enableColumnDragging: false,
    enableColumnPinning: false,
    // enableEditing: renderRowActions ? true : false,
    enableGrouping: true,
    enableDensityToggle: false,
    // renderRowActions: renderRowActions,
    columnResizeMode: 'onEnd',
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <NewFlightRecordButton />
        <CSVExportButton table={table} />
        <PDFExportButton />
      </Box>
    ),
    muiTablePaperProps: { variant: 'outlined', elevation: 0 },
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility },
    columnFilterDisplayMode: 'custom',
    enableFacetedValues: true,
    defaultColumn: {
      muiFilterTextFieldProps: ({ column }) => (getFilterLabel(column)),
    },
    enableSorting: false,
    enableColumnActions: false,
  });

  return (
    <>
      <MaterialReactTable table={table} {...props} />
      <Drawer anchor="right" open={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} sx={{
        '& .MuiDrawer-paper': {
          marginTop: '64px',
          height: 'calc(100% - 64px)',
        },
      }}>
        <Box sx={{ width: 350, padding: 2 }}>
          {table.getLeafHeaders().map((header) => {
            if (header.id === 'mrt-row-spacer' || header.id === 'mrt-row-actions' || header.id.startsWith('center_1_')) return null;
            return < MRT_TableHeadCellFilterContainer key={header.id} header={header} table={table} in />
          })}
        </Box>
      </Drawer>
    </>
  );
}

export default LogbookTable;