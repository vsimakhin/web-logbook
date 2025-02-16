import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const AddCustomAirportButton = () => {
  const dialogs = useDialogs();
  const payload = { name: '', city: '', country: '', elevation: '', lat: '', lon: '', isNew: true };

  return (
    <>
      <Tooltip title="New Custom Airport">
        <IconButton onClick={async () => await dialogs.open(AddEditCustomAirportModal, payload)}>
          <AddBoxOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  )
}

export default AddCustomAirportButton;