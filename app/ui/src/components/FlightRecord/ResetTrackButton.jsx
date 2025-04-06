import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
// Custom
import { queryClient } from '../../util/http/http';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { resetTrackLog } from '../../util/http/logbook';

export const ResetTrackButton = ({ flight, handleChange }) => {
  const dialogs = useDialogs();
  const navigate = useNavigate();

  const { mutateAsync: resetTrack, isError: isResetError, error: resetError, isSuccess: isResetSuccess } = useMutation({
    mutationFn: () => resetTrackLog({ id: flight.uuid, navigate }),
    onSuccess: async () => {
      handleChange("redraw", Math.random());
      await queryClient.invalidateQueries({ queryKey: ['flight', flight.uuid] });
      await queryClient.invalidateQueries({ queryKey: ['map-logbook'] });
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
  });

  return (
    <Tooltip title="Reset track and distance">
      <IconButton size="small" onClick={handleReset}>
        <RouteOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default ResetTrackButton;