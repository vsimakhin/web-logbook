import { useCallback, useMemo } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import { DEFAULT_PROFILE } from '../../../hooks/useSettings';
import useCustomFields from '../../../hooks/useCustomFields';

export const ResetLayoutButton = ({ setLayouts }) => {
  const { customFields } = useCustomFields();

  // check again for the custom fields 
  const layoutsF = useMemo(() => {
    if (!customFields) return DEFAULT_PROFILE.flightRecordLayout;

    const result = Object.fromEntries(Object.entries(DEFAULT_PROFILE.flightRecordLayout).map(([breakpoint, items]) => [breakpoint, items.map((item) => ({ ...item }))]));

    customFields?.forEach((field, index) => {
      Object.keys(result).forEach((breakpoint) => {
        const layout = result[breakpoint];
        if (layout.some((item) => item.i === field.uuid)) return;
        layout.push({ i: field.uuid, x: index, y: Infinity, w: 30, h: 1, minW: 4 });
      });
    });

    return result;
  }, [customFields]);

  const handleClick = useCallback(() => { setLayouts(layoutsF) }, [setLayouts, layoutsF]);

  return (
    <Tooltip title="Reset Layout">
      <IconButton size="small" onClick={handleClick}>
        <SettingsBackupRestoreOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default ResetLayoutButton;