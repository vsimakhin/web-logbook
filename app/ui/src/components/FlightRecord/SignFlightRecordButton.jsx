import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// Custom components and libraries
import SignModal from './SignModal';

export const SignFlightRecordButton = ({ payload, handleCloseMenu }) => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    handleCloseMenu();
    await dialogs.open(SignModal, payload)
  }, [dialogs, payload, handleCloseMenu]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleClick}>
      <DrawOutlinedIcon color="action" sx={{ m: 1 }} />Sign Flight Record
    </MenuItem>
  );
};

export default SignFlightRecordButton;