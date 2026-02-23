
import { memo, useEffect, useRef, useState } from 'react';
import {
  gridVisibleColumnDefinitionsSelector,
  gridFilteredSortedRowIdsSelector,
  gridPaginationModelSelector,
  gridSortModelSelector,
  useGridApiContext,
  useGridSelector,
  GridFooterContainer,
  GridPagination,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';

const AggregationRow = ({ label, values, columns, ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        fontWeight: '500',
        minHeight: 28,
        height: 28,
        alignItems: 'center',
        width: '100%',
        fontSize: '0.9rem',
      }}
    >
      {columns.map((column) => {
        const isAggregated = ['sum', 'avg', 'count'].includes(column.aggregation) || typeof column.aggregationFn === 'function';
        const isTimeField = column.field.includes('_time');
        const value = isAggregated ? values[column.field] : '';

        let displayText = '';
        if (column.field === props.fieldIdTotalLabel) {
          displayText = label;
        } else if (isAggregated) {
          if (value === undefined || value === null || value === '' || (isTimeField && (value === 0 || value === '0.0'))) {
            displayText = isTimeField ? '00:00' : '0';
          } else {
            displayText = typeof column.aggregationFormatter === 'function'
              ? column.aggregationFormatter(value)
              : value;
          }
        }

        return (
          <Box
            key={column.field}
            sx={{
              width: column.computedWidth,
              minWidth: column.computedWidth,
              display: 'flex',
              justifyContent: 'center',
              boxSizing: 'border-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              height: '100%',
              alignItems: 'center',
            }}
          >
            {displayText}
          </Box>
        );
      })}
    </Box>
  );
};

const XFooter = ({ showPageTotal = true, showPagination = true, showPreviousPagesTotal = false, ...props }) => {
  const apiRef = useGridApiContext();
  const visibleColumns = useGridSelector(apiRef, gridVisibleColumnDefinitionsSelector);
  const allRowIds = useGridSelector(apiRef, gridFilteredSortedRowIdsSelector);
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const sortModel = useGridSelector(apiRef, gridSortModelSelector);

  const [pageTotals, setPageTotals] = useState({});
  const [previousPagesTotals, setPreviousPagesTotals] = useState({});
  const [grandTotals, setGrandTotals] = useState({});

  const scrollRef = useRef(null);

  // Sync horizontal scroll
  useEffect(() => {
    const handleScroll = (params) => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = params.left;
      }
    };

    // DataGrid emits 'scrollPositionChange'
    return apiRef.current.subscribeEvent('scrollPositionChange', handleScroll);
  }, [apiRef]);

  useEffect(() => {
    const pTotals = {};
    const ppTotals = {};
    const gTotals = {};

    // Calculate page range
    const { page, pageSize } = paginationModel;
    const isDesc = (sortModel && sortModel.length > 0 && sortModel[0].sort === 'desc') ||
      (sortModel && sortModel.length === 0)

    const pageRowIds = pageSize > 0
      ? allRowIds.slice(page * pageSize, (page + 1) * pageSize)
      : allRowIds;

    const previousPagesRowIds = pageSize > 0
      ? (isDesc ? allRowIds.slice((page + 1) * pageSize) : allRowIds.slice(0, page * pageSize))
      : [];

    visibleColumns.forEach((column) => {
      const field = column.field;
      const aggType = column.aggregation;
      const hasAggregationFn = typeof column.aggregationFn === 'function';
      const isAggregatable = ['sum', 'avg', 'count'].includes(aggType) || hasAggregationFn;

      if (isAggregatable) {
        let pValues = [];
        let ppValues = [];
        let gValues = [];

        // Collect Page Values
        pageRowIds.forEach((rowId) => {
          if (rowId !== undefined && rowId !== null) {
            const val = apiRef.current.getCellValue(rowId, field);
            if (val !== undefined && val !== null && val !== '') {
              pValues.push(val);
            }
          }
        });

        // Collect Previous Pages Values
        if (showPreviousPagesTotal) {
          previousPagesRowIds.forEach((rowId) => {
            if (rowId !== undefined && rowId !== null) {
              const val = apiRef.current.getCellValue(rowId, field);
              if (val !== undefined && val !== null && val !== '') {
                ppValues.push(val);
              }
            }
          });
        }

        // Collect Grand Values
        allRowIds.forEach((rowId) => {
          if (rowId !== undefined && rowId !== null) {
            const val = apiRef.current.getCellValue(rowId, field);
            if (val !== undefined && val !== null && val !== '') {
              gValues.push(val);
            }
          }
        });

        if (hasAggregationFn) {
          pTotals[field] = column.aggregationFn(pValues);
          if (showPreviousPagesTotal) ppTotals[field] = column.aggregationFn(ppValues);
          gTotals[field] = column.aggregationFn(gValues);
        } else {
          const numericValues = (arr) => arr.map(v => {
            const num = typeof v === 'number' ? v : parseFloat(v);
            return !isNaN(num) ? num : null;
          }).filter(v => v !== null);

          if (aggType === 'sum') {
            const sum = (arr) => numericValues(arr).reduce((acc, val) => acc + val, 0);
            const ps = sum(pValues);
            pTotals[field] = field.includes('_time') ? ps.toFixed(1) : ps;

            if (showPreviousPagesTotal) {
              const pps = sum(ppValues);
              ppTotals[field] = field.includes('_time') ? pps.toFixed(1) : pps;
            }

            const gs = sum(gValues);
            gTotals[field] = field.includes('_time') ? gs.toFixed(1) : gs;
          } else if (aggType === 'avg') {
            const avg = (arr) => {
              const nums = numericValues(arr);
              return nums.length > 0 ? (nums.reduce((acc, val) => acc + val, 0) / nums.length) : 0;
            };
            pTotals[field] = avg(pValues).toFixed(2);
            if (showPreviousPagesTotal) ppTotals[field] = avg(ppValues).toFixed(2);
            gTotals[field] = avg(gValues).toFixed(2);
          } else if (aggType === 'count') {
            pTotals[field] = pValues.length;
            if (showPreviousPagesTotal) ppTotals[field] = ppValues.length;
            gTotals[field] = gValues.length;
          }
        }
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageTotals(pTotals);
    if (showPreviousPagesTotal) setPreviousPagesTotals(ppTotals);
    setGrandTotals(gTotals);
  }, [visibleColumns, allRowIds, paginationModel, apiRef, showPreviousPagesTotal, sortModel]);

  // Total width for the internal content wrapper to allow overflow: hidden sync
  const totalWidth = visibleColumns.reduce((acc, col) => acc + col.computedWidth, 0);

  return (
    <GridFooterContainer sx={{ flexDirection: 'column', alignItems: 'stretch', minHeight: 'auto' }}>
      {props.showAggregationFooter && (
        <Box ref={scrollRef} sx={{ overflow: 'hidden', width: '100%' }}>
          <Box sx={{ width: totalWidth, display: 'flex', flexDirection: 'column' }}>
            {showPageTotal && (
              <AggregationRow label="Page:" values={pageTotals} columns={visibleColumns} {...props} />
            )}
            {showPreviousPagesTotal && (
              <AggregationRow label="Previous:" values={previousPagesTotals} columns={visibleColumns} {...props} />
            )}
            <AggregationRow label="Total:" values={grandTotals} columns={visibleColumns} {...props} />
          </Box>
        </Box>
      )}
      {showPagination && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 0.5, borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
          <GridPagination />
        </Box>
      )}
    </GridFooterContainer>
  );
};

export default memo(XFooter);
