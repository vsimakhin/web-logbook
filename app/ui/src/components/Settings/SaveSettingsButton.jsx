import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import { updateSettings } from "../../util/http/settings";

export const SaveSettingsButton = ({ settings }) => {
  const navigate = useNavigate();

  const { mutateAsync: saveSettings, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateSettings({ settings, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
      await queryClient.invalidateQueries({ queryKey: ['auth-enabled'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save settings' });
  useSuccessNotification({ isSuccess, message: 'Settings saved' });

  return (
    <>
      <Tooltip title="Save settings">
        <IconButton size="small" onClick={() => saveSettings()}><SaveOutlinedIcon /></IconButton>
      </Tooltip>
    </>
  );
}

export default SaveSettingsButton;