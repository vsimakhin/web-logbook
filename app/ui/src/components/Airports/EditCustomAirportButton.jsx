import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const EditCustomAirportButton = ({ payload }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    await dialogs.open(AddEditCustomAirportModal, payload);
  }, [dialogs, payload]);

  return (
    <>
      <Tooltip title="Edit">
        <IconButton onClick={handleOnClick}>
          <EditOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  );
}

export default EditCustomAirportButton;