import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';


export const ResetLayoutButton = ({ setEditingLayout }) => {
  const handleClick = useCallback(async () => {
    setEditingLayout(false)
  }, [setEditingLayout]);

  return (
    <Tooltip title="Reser Layout">
      <IconButton size="small" onClick={handleClick}>
        <SettingsBackupRestoreOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default ResetLayoutButton;