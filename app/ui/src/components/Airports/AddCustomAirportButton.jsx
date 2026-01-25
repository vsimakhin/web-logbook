import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';
import { ToolbarButton } from '@mui/x-data-grid';

export const AddCustomAirportButton = () => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { name: '', city: '', country: '', elevation: '', lat: '', lon: '', isNew: true };
    await dialogs.open(AddEditCustomAirportModal, payload);
  }, [dialogs]);

  return (
    <Tooltip title="New Custom Airport">
      <ToolbarButton onClick={handleOnClick} color="default" label="Add Custom Airport">
        <AddBoxOutlinedIcon fontSize='small' />
      </ToolbarButton>
    </Tooltip >
  )
}

export default AddCustomAirportButton;