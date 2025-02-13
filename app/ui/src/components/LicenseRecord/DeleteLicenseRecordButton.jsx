import { useDialogs } from '@toolpad/core/useDialogs';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useErrorNotification, useSuccessNotification } from '../../hooks/useAppNotifications';
import { deleteLicenseRecord } from '../../util/http/licensing';

export const DeleteLicenseRecordButton = ({ license }) => {
  const dialogs = useDialogs();
  const navigate = useNavigate();

  const { mutateAsync: deleteLicense, isError, error, isSuccess } = useMutation({
    mutationFn: () => deleteLicenseRecord({ id: license.uuid, navigate }),
    onSuccess: () => navigate('/licensing'),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete license record' });
  useSuccessNotification({ isSuccess: isSuccess, message: 'License record deleted successfully' });

  const handleConfirmDelete = async () => {
    const confirmed = await dialogs.confirm('Are you sure you want to remove this license record?', {
      okText: 'Yes',
      cancelText: 'No',
    });

    if (confirmed) {
      await deleteLicense();
    }
  }

  return (
    <>
      {license.uuid !== "new" &&
        <Tooltip title="Delete license">
          <IconButton size="small" onClick={handleConfirmDelete}><DeleteOutlinedIcon /></IconButton>
        </Tooltip>
      }
    </>
  );
}

export default DeleteLicenseRecordButton;