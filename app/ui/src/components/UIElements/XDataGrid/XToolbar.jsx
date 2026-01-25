import { memo, useCallback, useMemo, useState } from 'react';
import { Toolbar } from '@mui/x-data-grid';
// MUI components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useMediaQuery, useTheme } from '@mui/material';
// MUI Icons
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
// Custom
import XToolbarQuickFilter from './XToolbarQuickFilter';
import XToolbarResetColumns from './XToolbarResetColumns';
import XToolbarColumnsPanelTrigger from './XToolbarColumnsPanel';
import XToolbarFilterPanelTrigger from './XToolbarFilterPanel';

const EMPTY_COLUMNS = [];

const ToolbarTitle = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    {icon && <Icon color="action" sx={{ mr: 1 }}>{icon}</Icon>}
    {title && (
      <Typography variant="overline" sx={{ mr: 1, display: { xs: icon ? 'none' : 'inline', md: 'inline' } }}>
        {title}
      </Typography>
    )}
  </Box>
);

export const XToolbar = ({
  title,
  icon,
  customActions,
  showQuickFilter = true,
  showColumnsPanel = true,
  showResetColumns = true,
  showFilters = true,
  initialColumns = EMPTY_COLUMNS,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchor);

  const handleMobileMenuOpen = useCallback((event) => { setMobileMenuAnchor(event.currentTarget) }, []);
  const handleMobileMenuClose = useCallback(() => { setMobileMenuAnchor(null) }, []);

  const mobileMenuItems = useMemo(() => {
    const items = [];

    if (customActions) {
      const actions = Array.isArray(customActions.props?.children)
        ? customActions.props.children
        : [customActions.props?.children || customActions];

      actions.filter(Boolean).forEach((action, index) => {
        items.push(
          <MenuItem key={`custom-${index}`} onClick={handleMobileMenuClose} sx={{ p: 0 }}>
            {action}
          </MenuItem>
        );
      });

      if (showQuickFilter) {
        items.push(<Divider key="divider-custom" />);
      }
    }

    if (showFilters) {
      items.push(
        <MenuItem key="filter" onClick={handleMobileMenuClose} sx={{ p: 0 }}>
          <XToolbarFilterPanelTrigger />
        </MenuItem>
      );
    }

    if (showColumnsPanel) {
      items.push(
        <MenuItem key="columns" onClick={handleMobileMenuClose} sx={{ p: 0 }}>
          <XToolbarColumnsPanelTrigger />
        </MenuItem>
      );
    }

    if (showResetColumns) {
      items.push(
        <MenuItem key="reset" onClick={handleMobileMenuClose} sx={{ p: 0 }}>
          <XToolbarResetColumns initialColumns={initialColumns} />
        </MenuItem>
      );
    }

    return items;
  }, [customActions, handleMobileMenuClose, initialColumns, showColumnsPanel, showFilters, showQuickFilter, showResetColumns]);

  const toolbarTitle = <ToolbarTitle icon={icon} title={title} />;

  if (isMobile) {
    return (
      <Toolbar>
        <Box sx={{ flex: 1, mx: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          {toolbarTitle}
        </Box>

        {showQuickFilter && <XToolbarQuickFilter />}
        <IconButton onClick={handleMobileMenuOpen}>
          <MoreVertOutlinedIcon />
        </IconButton>

        <Menu
          id="toolbar-mobile-menu"
          anchorEl={mobileMenuAnchor}
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          keepMounted
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {mobileMenuItems}
        </Menu>
      </Toolbar>
    );
  }

  return (
    <Toolbar>
      <Box sx={{ flex: 1, mx: 0.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        {toolbarTitle}
      </Box>

      {customActions && (
        <>
          {customActions}
          <Divider sx={{ mx: 0.5 }} orientation="vertical" />
        </>
      )}

      {showQuickFilter && <XToolbarQuickFilter />}
      {showFilters && <XToolbarFilterPanelTrigger />}
      {showColumnsPanel && <XToolbarColumnsPanelTrigger />}
      {showResetColumns && <XToolbarResetColumns initialColumns={initialColumns} />}
    </Toolbar>
  );
}

export default memo(XToolbar);

