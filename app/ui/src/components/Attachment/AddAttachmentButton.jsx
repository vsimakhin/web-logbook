import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom components
import { queryClient } from "../../util/http/http";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { uploadAttachement } from "../../util/http/attachment";

export const AddAttachmentButton = ({ id }) => {
  const navigate = useNavigate();

  const { mutateAsync: upload, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadAttachement({ payload: data, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attachments', id] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload attachment' });
  useSuccessNotification({ isSuccess, message: 'Attachment uploaded' });

  const handleFileChange = async (event) => {
    for (const file of event.target.files) {
      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('id', id);

        await upload({ data: formData });
      }
    }
  };

  return (
    <>
      {isPending && <CircularProgress size={24} />}
      {!isPending &&
        <Tooltip title="Add new attachment">
          <IconButton size="small" component="label" ><AddBoxOutlinedIcon />
            <input hidden type="file" name="document" id="document" onChange={handleFileChange} multiple={true} />
          </IconButton>
        </Tooltip>
      }
    </>
  );
}

export default AddAttachmentButton;