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

const XDataGridContent = ({ tableId, rows, columns, ...props }) => {
  const apiRef = useGridApiRef();
  const [paginationModel, setPaginationModel] = useLocalStorageState(`${tableId}-pagination`, { pageSize: defaultPageSize, page: 0 }, { codec: codec });
  const [columnsState, setColumnsState] = useLocalStorageState(`${tableId}-columns`, {}, { codec: codec });

  const { filterModel } = useFilter();
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
      return rows;
    }

    return rows.filter((row) => {
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
  }, [rows, deferredFilterModel, columnMap]);

  const slots = useMemo(() => ({
    footer: XFooter,
    toolbar: XToolbar,
    columnsPanel: XToolbarColumnsPanel,
    filterPanel: XToolbarFilterPanel,
  }), []);

  return (
    <DataGrid
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
        toolbar: { initialColumns: columns },
      }}
      showToolbar
      {...props}
    />
  );
};

export const XDataGrid = (props) => (
  <FilterProvider>
    <XDataGridContent {...props} />
  </FilterProvider>
);

export default XDataGrid;