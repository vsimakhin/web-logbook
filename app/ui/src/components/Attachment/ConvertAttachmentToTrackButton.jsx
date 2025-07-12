import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNotifications } from '@toolpad/core/useNotifications';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { fetchAttachment } from '../../util/http/attachment';
import { parseTrackFile } from './helpers';
import { uploadTrackLog } from '../../util/http/logbook';
import { queryClient } from '../../util/http/http';

export const ConvertAttachmentToTrackButton = ({ attachment, handleClose }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const { mutateAsync: uploadTrack, isPending: isTrackPending, isError: isTrackError, error: trackError, isSuccess: isTrackSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadTrackLog({ id: attachment.record_id, track: data, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments', attachment.record_id] });
      await queryClient.invalidateQueries({ queryKey: ['flight', attachment.record_id] });
      await queryClient.invalidateQueries({ queryKey: ['map-logbook'] })
    }
  });
  useErrorNotification({ isError: isTrackError, error: trackError, fallbackMessage: 'Failed to upload track log' });
  useSuccessNotification({ isSuccess: isTrackSuccess, message: 'Track log uploaded' });

  const handleConvert = useCallback(async () => {
    const data = await fetchAttachment({ id: attachment.uuid, navigate });
    const byteCharacters = atob(data.document);
    const extractedCoordinates = parseTrackFile(byteCharacters);

    if (extractedCoordinates.length === 0) {
      notifications.show("No coordinates found in KML file", {
        severity: "error",
        key: "kml-parse-error",
        autoHideDuration: 3000,
      });
      return;
    }

    await uploadTrack({ data: extractedCoordinates });

    handleClose();
  }, [handleClose]);

  return (
    <MenuItem onClick={handleConvert} sx={{ p: 0, pr: 1 }}>
      <MapOutlinedIcon sx={{ m: 1 }} color="action" />Convert to track
    </MenuItem>
  )
}

export default ConvertAttachmentToTrackButton;