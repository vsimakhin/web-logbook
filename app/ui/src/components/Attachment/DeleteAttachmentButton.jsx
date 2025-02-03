import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { queryClient } from '../../util/http/http';
import { deleteAttachment } from '../../util/http/attachment';

export const DeleteAttachmentButton = ({ attachment, handleClose }) => {
  const navigate = useNavigate();
  const dialogs = useDialogs();

  const { mutateAsync: removeAttachment, isError: isDeleteError, error: deleteError, isSuccess: isDeleteSuccess } = useMutation({
    mutationFn: () => deleteAttachment({ id: attachment.uuid, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments', attachment.record_id] });
    }
  });
  useErrorNotification({ isError: isDeleteError, error: deleteError, fallbackMessage: 'Failed to delete attachment' });
  useSuccessNotification({ isSuccess: isDeleteSuccess, message: 'Attachment deleted' });

  const handleDelete = async () => {
    const confirmed = await dialogs.confirm(`Are you sure you want to remove ${attachment.document_name} attachment?`, {
      okText: 'Yes',
      cancelText: 'No',
    });

    if (confirmed) {
      await removeAttachment();
    }

    handleClose();
  }

  return (
    <MenuItem onClick={handleDelete} sx={{ p: 0 }}><DeleteOutlinedIcon sx={{ m: 1 }} color="action" />Delete</MenuItem>
  );
}

export default DeleteAttachmentButton;