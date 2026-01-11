import { useMemo, useDeferredValue, useEffect } from 'react';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { useLocalStorageState } from '@toolpad/core';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import XPagination from './XPagination';
import XFooter from './XFooter';
import XToolbar from './XToolbar';
import XToolbarColumnsPanel from './XToolbarColumnsPanel';
import XToolbarFilterPanel from './XToolbarFilterPanel';
import { FilterProvider, useFilter } from './FilterContext';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const defaultPageSizeOptions = [5, 10, 15, 20, 25, 50, 75, 100, { value: -1, label: 'All' }]
const defaultPageSize = defaultPageSizeOptions[3]
const codec = {
  parse: (value) => {
    try {
      return JSON.parse(value)
    } catch {
      return {};
    }
  },
  stringify: (value) => JSON.stringify(value),
}
const toMinutes = (val) => {
  if (!val || typeof val !== 'string') return null;
  const parts = val.split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const StyledDataGrid = styled(DataGrid)(({ theme }) => {
  const isLight = theme.palette.mode === 'light';

  return {
    border: 0,
    color: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    WebkitFontSmoothing: 'auto',
    letterSpacing: 'normal',

    // Column header container
    '& .MuiDataGrid-columnsContainer': {
      backgroundColor: isLight ? '#f5f5f5' : '#1d1d1d',
      borderBottom: `1px solid ${isLight ? '#e0e0e0' : '#303030'}`,
    },

    // Column headers
    '& .MuiDataGrid-columnHeader': {
      borderRight: `1px solid ${isLight ? '#e0e0e0' : '#303030'}`,
      fontWeight: 600,
    },

    // Cells
    '& .MuiDataGrid-cell': {
      borderRight: `1px solid ${isLight ? '#e0e0e0' : '#303030'}`,
      borderBottom: `1px solid ${isLight ? '#e0e0e0' : '#303030'}`,
      color: isLight ? 'rgba(0,0,0,0.87)' : 'rgba(255,255,255,0.65)',
      backgroundColor: 'transparent',
    },

    '& .MuiDataGrid-columnSeparator': {
      color: isLight ? '#e0e0e0' : '#303030',
    },

    // Row hover effect
    '& .MuiDataGrid-row:hover': {
      backgroundColor: isLight
        ? 'rgba(0, 0, 0, 0.08) !important' // slightly darker than row bg
        : 'rgba(255, 255, 255, 0.08) !important',
    },

    // Pagination items
    '& .MuiPaginationItem-root': {
      borderRadius: 0,
    },

    // Sort icons / checkbox colors
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
      outline: 'none',
    },

    '& .MuiDataGrid-row.Mui-selected': {
      backgroundColor: isLight
        ? 'rgba(25, 118, 210, 0.15) !important' // light blue highlight
        : 'rgba(255, 255, 255, 0.2) !important',
    },
    '& .MuiDataGrid-row.Mui-selected:hover': {
      backgroundColor: isLight
        ? 'rgba(25, 118, 210, 0.25) !important' // slightly darker on hover
        : 'rgba(255, 255, 255, 0.25) !important',
    },
  };
});


const XDataGridContent = ({ tableId, rows, columns, ...props }) => {
  const apiRef = useGridApiRef();
  const [paginationModel, setPaginationModel] = useLocalStorageState(`${tableId}-pagination`, { pageSize: defaultPageSize, page: 0 }, { codec: codec });
  const [columnsState, setColumnsState] = useLocalStorageState(`${tableId}-columns`, {}, { codec: codec });

  const { filterModel, setFilteredRows } = useFilter();
  const deferredFilterModel = useDeferredValue(filterModel);

  useEffect(() => {
    if (!apiRef.current) return;

    const save = () => {
      const state = apiRef.current.exportState();
      setColumnsState(state.columns);
    };

    const unsubscribes = [
      apiRef.current.subscribeEvent('columnWidthChange', save),
      apiRef.current.subscribeEvent('columnVisibilityModelChange', save),
      apiRef.current.subscribeEvent('columnOrderChange', save),
      apiRef.current.subscribeEvent('debouncedResize', save),
    ];

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [apiRef, setColumnsState]);

  const columnMap = useMemo(() => {
    const map = new Map();
    columns.forEach(col => map.set(col.field, col));
    return map;
  }, [columns]);

  const filteredRows = useMemo(() => {
    if (!deferredFilterModel.items.length) {
      setFilteredRows(rows);
      return rows;
    }

    const filtered = rows.filter((row) => {
      return deferredFilterModel.items.every((filter) => {
        const { field, operator, value } = filter;
        // const column = columns.find((col) => col.field === field);
        const column = columnMap.get(field);
        if (!column) return true;

        const rowValue = column.valueGetter ? column.valueGetter(row[field], row) : row[field];
        const type = column.columnType || column.type;

        const hasRowValue = rowValue !== null && rowValue !== undefined && rowValue !== '';

        if (operator === 'contains') {
          return String(rowValue || '').toLowerCase().includes(String(value).toLowerCase());
        }

        if (operator === 'equals') {
          return !!rowValue === !!value;
        }

        if (operator === '>=' || operator === '<=') {
          if (!hasRowValue) return false;

          if (type === 'number') {
            const v = Number(value);
            const rv = Number(rowValue);
            return operator === '>=' ? rv >= v : rv <= v;
          }

          if (type === 'date') {
            const v = dayjs(value);
            const rv = dayjs(rowValue);
            return operator === '>=' ? rv.isSameOrAfter(v, 'day') : rv.isSameOrBefore(v, 'day');
          }

          if (type === 'time') {
            const v = toMinutes(value);
            const rv = toMinutes(rowValue);
            if (v === null || rv === null) return true;
            return operator === '>=' ? rv >= v : rv <= v;
          }
        }

        return true;
      });
    });
    setFilteredRows(filtered);
    return filtered;
  }, [rows, deferredFilterModel, columnMap, setFilteredRows]);

  const slots = useMemo(() => ({
    footer: XFooter,
    toolbar: XToolbar,
    columnsPanel: XToolbarColumnsPanel,
    filterPanel: XToolbarFilterPanel,
  }), []);

  return (
    <Box sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <StyledDataGrid
        sx={{
          '& .MuiDataGrid-cell': { px: 0.5 },
          '& .MuiDataGrid-columnHeaderTitle': { px: 0.1 },
        }}
        key={tableId}
        apiRef={apiRef}
        rows={filteredRows}
        columns={columns}
        rowHeight={36}
        density="compact"
        initialState={{ columns: columnsState, ...props.initialState }}
        // pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        // filtering
        pageSizeOptions={props.pageSizeOptions || [5, 10, 15, 20, 25, 50, 75, 100, { value: -1, label: 'All' }]}
        slots={slots}
        slotProps={{
          basePagination: {
            material: {
              ActionsComponent: XPagination,
            },
          },
          footer: { fieldIdTotalLabel: props.footerFieldIdTotalLabel, showAggregationFooter: props.showAggregationFooter },
          toolbar: { initialColumns: columns, customActions: props.customActions },
        }}
        showToolbar
        {...props}
      />
    </Box>
  );
};

export const XDataGrid = (props) => (
  <FilterProvider>
    <XDataGridContent {...props} />
  </FilterProvider>
);

export default XDataGrid;