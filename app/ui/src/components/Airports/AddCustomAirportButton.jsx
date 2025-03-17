import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const AddCustomAirportButton = () => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { name: '', city: '', country: '', elevation: '', lat: '', lon: '', isNew: true };
    await dialogs.open(AddEditCustomAirportModal, payload);
  }, [dialogs]);

  return (
    <>
      <Tooltip title="New Custom Airport">
        <IconButton onClick={handleOnClick}>
          <AddBoxOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  )
}

export default AddCustomAirportButton;