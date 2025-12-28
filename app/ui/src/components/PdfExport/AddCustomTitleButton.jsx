import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom components
import { queryClient } from "../../util/http/http";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { uploadCustomTitle } from "../../util/http/export";

export const AddCustomTitleButton = ({ format }) => {
  const id = `custom_title_${format.toLowerCase()}`;

  const { mutateAsync: upload, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async ({ data }) => await uploadCustomTitle({ payload: data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-title', format] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload custom title' });
  useSuccessNotification({ isSuccess, message: 'Custom title uploaded' });

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
        <Tooltip title="Add custom title page">
          <IconButton size="small" component="label" ><AddBoxOutlinedIcon />
            <input hidden type="file" name="document" id="document" onChange={handleFileChange} accept="application/pdf" />
          </IconButton>
        </Tooltip>
      }
    </>
  );
}

export default AddCustomTitleButton;