import { useMutation } from "@tanstack/react-query";
import { useDialogs } from "@toolpad/core/useDialogs";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// Custom components
import { queryClient } from "../../util/http/http";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { deleteAttachment } from "../../util/http/attachment";

export const DeleteCustomTitleButton = ({ format }) => {
  const dialogs = useDialogs();
  const id = `custom_title_${format.toLowerCase()}`;

  const { mutateAsync: deleteCustomTitle, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: () => deleteAttachment({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-title', format] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete custom title' });
  useSuccessNotification({ isSuccess, message: 'Custom title deleted' });

  const handleConfirmDelete = async () => {
    const confirmed = await dialogs.confirm('Are you sure you want to remove this custom title page?', {
      okText: 'Yes',
      cancelText: 'No',
    });

    if (confirmed) {
      await deleteCustomTitle();
    }
  }

  return (
    <>
      {isPending && <CircularProgress size={24} />}
      {!isPending &&
        <Tooltip title="Delete title page">
          <IconButton size="small" onClick={handleConfirmDelete}><DeleteOutlinedIcon /></IconButton>
        </Tooltip >
      }
    </>
  );
}

export default DeleteCustomTitleButton;