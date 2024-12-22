import { MaterialReactTable, useMaterialReactTable, MRT_TableHeadCellFilterContainer } from 'material-react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
// Custom components and libraries
import { handleExportRows } from '../../util/csv-export';
import { dateFilterFn, getFilterLabel, landingFilterFn, timeFilterFn } from './helpers';

export const LogbookTable = ({ columns, data, isLoading, ...props }) => {
  const tablePageKey = 'logbook-table-page-size';
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);

  const toggleFilterDrawer = (open) => () => { setIsFilterDrawerOpen(open) };

  const initialPageSize = useMemo(() => {
    return localStorage.getItem(tablePageKey) ? parseInt(localStorage.getItem(tablePageKey)) : 15;
  }, [tablePageKey]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  useEffect(() => {
    localStorage.setItem(tablePageKey, pagination.pageSize);
  }, [pagination.pageSize, tablePageKey]);

  const filterFns = useMemo(() => ({
    dateFilterFn: dateFilterFn,
    timeFilterFn: timeFilterFn,
    landingFilterFn: landingFilterFn,
  }), []);

  const handleCSVExport = useCallback((table) => {
    handleExportRows(table.getPrePaginationRowModel().rows);
  }, []);

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
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        <Tooltip title="Quick CSV Export">
          <IconButton onClick={() => handleCSVExport(table)} size="small"><FileDownloadOutlinedIcon /></IconButton>
        </Tooltip>
      </Box>
    ),
    muiTablePaperProps: { variant: 'outlined', elevation: 0 },
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters },
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
      <Drawer anchor="right" open={isFilterDrawerOpen} onClose={toggleFilterDrawer(false)} sx={{
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