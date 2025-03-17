import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { deleteFlightRecord } from '../../util/http/logbook';

export const DeleteFlightRecordButton = ({ flight }) => {
  const dialogs = useDialogs();
  const navigate = useNavigate();

  const { mutateAsync: deleteFlight, isError, error, isSuccess } = useMutation({
    mutationFn: () => deleteFlightRecord({ id: flight.uuid, navigate }),
    onSuccess: () => navigate('/logbook'),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete flight record' });
  useSuccessNotification({ isSuccess: isSuccess, message: 'Flight record deleted successfully' });

  const handleConfirmDelete = async () => {
    const confirmed = await dialogs.confirm('Are you sure you want to remove this flight record?');
    if (confirmed) {
      await deleteFlight();
    }
  }

  return (
    <>
      {flight.uuid !== "new" &&
        <Tooltip title="Delete flight">
          <IconButton size="small" onClick={handleConfirmDelete}><DeleteOutlinedIcon /></IconButton>
        </Tooltip>
      }
    </>
  );
}

export default DeleteFlightRecordButton;