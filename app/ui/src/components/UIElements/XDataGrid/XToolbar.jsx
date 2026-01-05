import { memo } from 'react';
import { Toolbar } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import XToolbarQuickFilter from './XToolbarQuickFilter';
import XToolbarResetColumns from './XToolbarResetColumns';
import XToolbarColumnsPanelTrigger from './XToolbarColumnsPanel';
import XToolbarFilterPanelTrigger from './XToolbarFilterPanel';

const EMPTY_COLUMNS = [];

export const XToolbar = ({
  CustomActions,
  showQuickFilter = true,
  showColumnsPanel = true,
  showResetColumns = true,
  showFilters = true,
  initialColumns = EMPTY_COLUMNS,
}) => {
  return (
    <Toolbar>
      <Box sx={{ flex: 1, mx: 0.5 }}>
        {CustomActions}
      </Box>

      {showFilters && <XToolbarFilterPanelTrigger />}
      {showQuickFilter && <XToolbarQuickFilter />}
      {showColumnsPanel && <XToolbarColumnsPanelTrigger />}
      {showResetColumns && <XToolbarResetColumns initialColumns={initialColumns} />}
    </Toolbar>
  );
}

export default memo(XToolbar);
