import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';

// MUI Icons
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
// Custom
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { resetTrackLog } from '../../util/http/logbook';

export const ResetTrackButton = ({ flight, handleChange, handleCloseMenu }) => {
  const dialogs = useDialogs();
  const navigate = useNavigate();

  const { mutateAsync: resetTrack, isError: isResetError, error: resetError, isSuccess: isResetSuccess } = useMutation({
    mutationFn: () => resetTrackLog({ id: flight.uuid, navigate }),
    onSuccess: async () => {
      handleChange("redraw", Math.random());
      await queryClient.invalidateQueries({ queryKey: ['flight', flight.uuid] });
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
    }
  });
  useErrorNotification({ isError: isResetError, error: resetError, fallbackMessage: 'Failed to reset track log' });
  useSuccessNotification({ isSuccess: isResetSuccess, message: 'Track log reset' });

  const handleReset = useCallback(async () => {
    const reset = await dialogs.confirm("Do you want to reset the track and distance?", {
      okText: 'Yes',
      cancelText: 'No',
    });
    if (reset) {
      await resetTrack();
    }
    handleCloseMenu();
  }, [dialogs, resetTrack, handleCloseMenu]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleReset}>
      <RouteOutlinedIcon color="action" sx={{ m: 1 }} />Reset track and distance
    </MenuItem>
  )
}

export default ResetTrackButton;