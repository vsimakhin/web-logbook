import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useErrorNotification, useSuccessNotification } from "../../../hooks/useAppNotifications";
import { queryClient } from "../../../util/http/http";
import { updateSignature } from "../../../util/http/settings";

export const SaveSignatureButton = ({ settings }) => {
  const navigate = useNavigate();

  const { mutateAsync: saveSignature, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateSignature({ settings, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save logbook signature' });
  useSuccessNotification({ isSuccess, message: 'Logbook signature saved' });

  return (
    <>
      <Tooltip title="Save Signature">
        <IconButton size="small" onClick={() => saveSignature()}><SaveOutlinedIcon /></IconButton>
      </Tooltip>
    </>
  );
}

export default SaveSignatureButton;