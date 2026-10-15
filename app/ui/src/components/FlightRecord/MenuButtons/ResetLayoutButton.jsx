import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import { DEFAULT_PROFILE } from '../../../hooks/useSettings';

export const ResetLayoutButton = ({ setLayouts }) => {
  const handleClick = useCallback(() => {
    setLayouts(DEFAULT_PROFILE.flightRecordLayout);
  }, [setLayouts]);

  return (
    <Tooltip title="Reset Layout">
      <IconButton size="small" onClick={handleClick}>
        <SettingsBackupRestoreOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default ResetLayoutButton;