import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDialogs } from '@toolpad/core/useDialogs';
import { use, useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { queryClient } from '../../util/http/http';
import { deleteAttachment } from '../../util/http/attachment';
import { resetTrackLog } from '../../util/http/logbook';

export const DeleteAttachmentButton = ({ attachment, handleClose }) => {
  const navigate = useNavigate();
  const dialogs = useDialogs();

  // remove attachment mutation
  const { mutateAsync: removeAttachment, isError: isDeleteError, error: deleteError, isSuccess: isDeleteSuccess } = useMutation({
    mutationFn: () => deleteAttachment({ id: attachment.uuid, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments', attachment.record_id] });
    }
  });
  useErrorNotification({ isError: isDeleteError, error: deleteError, fallbackMessage: 'Failed to delete attachment' });
  useSuccessNotification({ isSuccess: isDeleteSuccess, message: 'Attachment deleted' });

  // reset track and distance mutation
  const { mutateAsync: resetTrack, isError: isResetError, error: resetError, isSuccess: isResetSuccess } = useMutation({
    mutationFn: () => resetTrackLog({ id: attachment.record_id, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['flight', attachment.record_id] });
      await queryClient.invalidateQueries({ queryKey: ['map-logbook'] });
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
    }
  });
  useErrorNotification({ isError: isResetError, error: resetError, fallbackMessage: 'Failed to reset track log' });
  useSuccessNotification({ isSuccess: isResetSuccess, message: 'Track log reset' });

  const handleDelete = useCallback(async () => {
    const confirmed = await dialogs.confirm(`Are you sure you want to remove ${attachment.document_name} attachment?`, {
      okText: 'Yes',
      cancelText: 'No',
    });

    if (confirmed) {
      // check if attachment is a track log
      if (attachment.document_name.endsWith(".kml")) {
        const reset = await dialogs.confirm("Looks like it's a track log (*.kml file). Do you want to reset the track and distance?", {
          okText: 'Yes',
          cancelText: 'No',
        });
        if (reset) {
          await resetTrack();
        }
      }

      // remove attachment
      await removeAttachment();
    }

    handleClose();
  }, [dialogs, removeAttachment, attachment, handleClose]);

  return (
    <MenuItem onClick={handleDelete} sx={{ p: 0, pr: 1 }}><DeleteOutlinedIcon sx={{ m: 1 }} color="action" />Delete</MenuItem>
  );
}

export default DeleteAttachmentButton;