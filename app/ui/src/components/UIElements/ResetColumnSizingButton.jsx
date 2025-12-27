import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';


export const ResetColumnSizingButton = ({ resetFunction }) => {
  const handleReset = useCallback(() => {
    resetFunction({});
  }, [resetFunction]);

  return (
    <Tooltip title="Reset Column Sizing">
      <IconButton onClick={handleReset} size="small">
        <SettingsBackupRestoreOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default ResetColumnSizingButton;