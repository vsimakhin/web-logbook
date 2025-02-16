import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const EditCustomAirportButton = ({ payload }) => {
  const dialogs = useDialogs();

  return (
    <>
      <Tooltip title="Edit">
        <IconButton onClick={async () => await dialogs.open(AddEditCustomAirportModal, payload)}>
          <EditOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  );
}

export default EditCustomAirportButton;