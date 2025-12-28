import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import { updateSettings } from "../../util/http/settings";

export const SaveSettingsButton = ({ settings }) => {
  const { mutateAsync: saveSettings, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateSettings({ settings }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
      await queryClient.invalidateQueries({ queryKey: ['auth-enabled'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save settings' });
  useSuccessNotification({ isSuccess, message: 'Settings saved' });

  const handleOnClick = useCallback(async () => {
    saveSettings();
  }, [saveSettings]);

  return (
    <Tooltip title="Save settings">
      <IconButton size="small" onClick={handleOnClick}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default SaveSettingsButton;