import { MaterialReactTable, useMaterialReactTable, MRT_TableHeadCellFilterContainer } from 'material-react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
// MUI Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
// Custom components and libraries
import { dateFilterFn } from '../../util/helpers';
import { handleExportRows } from '../../util/csv-export';
import { IconButton } from '@mui/material';

const PAGE_SIZE_KEY = 'pageSize';

export const DataTable = ({ tableName, columns, data, isLoading, renderRowActions, customComponents, initialState = {}, tableProps, onFilterChange, ...props }) => {
  const tablePageKey = `${PAGE_SIZE_KEY}-${tableName}`;
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const toggleFilterDrawer = (open) => () => {
    setIsFilterDrawerOpen(open);
  };

  const initialPageSize = useMemo(() => {
    return localStorage.getItem(tablePageKey) ? parseInt(localStorage.getItem(tablePageKey)) : 15;
  }, [tablePageKey]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    localStorage.setItem(tablePageKey, pagination.pageSize);
  }, [pagination.pageSize, tablePageKey]);

  const tableInitialState = useMemo(() => ({
    density: 'compact',
    ...initialState,
  }), [initialState]);

  const filterFns = useMemo(() => ({
    dateFilterFn: dateFilterFn,
  }), []);

  const handleCSVExport = useCallback((table) => {
    handleExportRows(table.getPrePaginationRowModel().rows);
  }, []);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    initialState: tableInitialState,
    isLoading: isLoading,
    enableColumnResizing: true,
    enableGlobalFilterModes: true,
    enableColumnFilters: true,
    onShowColumnFiltersChange: () => (setIsFilterDrawerOpen(true)),
    enableColumnDragging: false,
    enableColumnPinning: false,
    enableEditing: renderRowActions ? true : false,
    enableGrouping: true,
    enableDensityToggle: false,
    renderRowActions: renderRowActions,
    columnResizeMode: 'onEnd',
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {customComponents}
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
    muiFilterTextFieldProps: ({ column }) => ({
      label: `Filter by ${column.columnDef.header}`,
    }),
    ...tableProps
  });

  useEffect(() => {
    if (columnFilters && onFilterChange) {
      const filteredRows = table.getFilteredRowModel().rows.map(row => row.original);
      onFilterChange({ filters: columnFilters, filteredRows });
    }
  }, [columnFilters, onFilterChange, table, data]);

  return (
    <>
      <MaterialReactTable table={table} {...props} />
      <Drawer anchor="right" open={isFilterDrawerOpen} onClose={toggleFilterDrawer(false)} sx={{
        '& .MuiDrawer-paper': {
          marginTop: '64px', // Adjust this based on your toolbar height
          height: 'calc(100% - 64px)', // Ensure the drawer doesn’t exceed the viewport height
        },
      }}>
        <Box sx={{ width: 350, padding: 2 }}>
          {table.getLeafHeaders().map((header) => {
            if (header.id === 'mrt-row-spacer' || header.id === 'mrt-row-actions') return null;
            return < MRT_TableHeadCellFilterContainer key={header.id} header={header} table={table} in />
          })}
        </Box>
      </Drawer>
    </>
  );
}