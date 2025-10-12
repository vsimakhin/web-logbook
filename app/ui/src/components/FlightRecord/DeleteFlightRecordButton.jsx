import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { deleteFlightRecord } from '../../util/http/logbook';
import { queryClient } from '../../util/http/http';

export const DeleteFlightRecordButton = ({ flight, handleCloseMenu }) => {
  const dialogs = useDialogs();
  const navigate = useNavigate();

  const { mutateAsync: deleteFlight, isError, error, isSuccess } = useMutation({
    mutationFn: () => deleteFlightRecord({ id: flight.uuid, navigate }),
    onSuccess: async () => {
      handleCloseMenu();
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
      await queryClient.invalidateQueries({ queryKey: ['map-logbook'] });
      await queryClient.invalidateQueries({ queryKey: ['aircraft-models'] });
      await queryClient.invalidateQueries({ queryKey: ['aircraft-regs'] });

      navigate('/logbook');
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete flight record' });
  useSuccessNotification({ isSuccess: isSuccess, message: 'Flight record deleted successfully' });

  const handleConfirmDelete = useCallback(async () => {
    const confirmed = await dialogs.confirm('Are you sure you want to remove this flight record?');
    if (confirmed) {
      await deleteFlight();
    }
  });

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleConfirmDelete}>
      <DeleteOutlinedIcon color="action" sx={{ m: 1 }} />Delete Flight Record
    </MenuItem>
  );
}

export default DeleteFlightRecordButton;