import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import FolderDeleteOutlinedIcon from '@mui/icons-material/FolderDeleteOutlined';
// Custom
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { deleteLicenseRecordAttachment } from '../../util/http/licensing';
import { queryClient } from '../../util/http/http';

export const DeleteLicenseRecordAttachmentButton = ({ license }) => {
  const dialogs = useDialogs();
  const navigate = useNavigate();

  const { mutateAsync: deleteLicense, isError, error, isSuccess } = useMutation({
    mutationFn: () => deleteLicenseRecordAttachment({ id: license.uuid, navigate }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['license', license.uuid] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete license record attachment' });
  useSuccessNotification({ isSuccess: isSuccess, message: 'License record attachement deleted successfully' });

  const handleConfirmDelete = useCallback(async () => {
    const confirmed = await dialogs.confirm('Are you sure you want to remove license record attachment?', {
      okText: 'Yes',
      cancelText: 'No',
    });

    if (confirmed) {
      await deleteLicense();
    }
  }, [dialogs, deleteLicense]);

  return (
    <>
      {license.uuid !== "new" &&
        <Tooltip title="Delete license attachment">
          <IconButton size="small" onClick={handleConfirmDelete}><FolderDeleteOutlinedIcon /></IconButton>
        </Tooltip>
      }
    </>
  );
}

export default DeleteLicenseRecordAttachmentButton;