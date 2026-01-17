import { memo, useCallback } from 'react';
import {
  gridPageCountSelector,
  useGridApiContext,
  useGridSelector
} from '@mui/x-data-grid';
import Pagination from '@mui/material/Pagination';

export const XPagination = ({ page, onPageChange, className }) => {
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  const handlePageChange = useCallback((event, newPage) => {
    onPageChange(event, newPage - 1);
  }, [onPageChange]);

  return (
    <Pagination
      variant="outlined"
      shape="rounded"
      size="small"
      className={className}
      count={pageCount}
      page={page + 1}
      onChange={handlePageChange}
      siblingCount={0}
      boundaryCount={1}
    />
  );
}

export default memo(XPagination);