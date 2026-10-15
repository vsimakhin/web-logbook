import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

export const SaveLayoutButton = ({ setEditingLayout }) => {
  const handleClick = useCallback(async () => {
    setEditingLayout(false)
  }, [setEditingLayout]);

  return (
    <Tooltip title="Save Layout">
      <IconButton size="small" onClick={handleClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default SaveLayoutButton;