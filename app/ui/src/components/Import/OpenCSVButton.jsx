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
import { uploadCustomTitle } from "../../util/http/export";

export const OpenCSVButton = () => {
  const navigate = useNavigate();

  // const { mutateAsync: upload, isPending, isError, error, isSuccess } = useMutation({
  //   mutationFn: async ({ data }) => await uploadCustomTitle({ payload: data, navigate }),
  //   onSuccess: async () => {
  //     await queryClient.invalidateQueries({ queryKey: ['custom-title', format] })
  //   }
  // });
  // useErrorNotification({ isError, error, fallbackMessage: 'Failed to upload custom title' });
  // useSuccessNotification({ isSuccess, message: 'Custom title uploaded' });

  const handleFileChange = async (event) => {
    for (const file of event.target.files) {
      if (file) {
        // read file
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = (e.target.result);
          console.log(text)
        }
        reader.readAsText(file);

        // await upload({ data: formData });
      }
    }
  };

  return (
    <>
      <Tooltip title="Open CSV for import">
        <IconButton size="small" component="label" ><AddBoxOutlinedIcon />
          <input hidden type="file" name="document" id="document" onChange={handleFileChange}
            accept=".csv, text/csv, application/csv, text/comma-separated-values" />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default OpenCSVButton;