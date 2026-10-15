import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import PictureInPictureOutlinedIcon from '@mui/icons-material/PictureInPictureOutlined';

export const EditLayoutButton = ({ handleCloseMenu, setEditingLayout }) => {
  const handleOnClick = useCallback(async () => {
    setEditingLayout(true)
    handleCloseMenu();
  }, [handleCloseMenu, setEditingLayout]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleOnClick}>
      <PictureInPictureOutlinedIcon color="action" sx={{ m: 1 }} />Layout
    </MenuItem>
  )
}

export default EditLayoutButton;