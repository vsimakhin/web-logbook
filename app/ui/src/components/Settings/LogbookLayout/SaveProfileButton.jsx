import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useErrorNotification, useSuccessNotification } from "../../../hooks/useAppNotifications";
import { queryClient } from "../../../util/http/http";
import { updateProfileSettings } from "../../../util/http/settings";

export const SaveProfileButton = ({ settings }) => {
  const { mutateAsync: saveSettings, isError, error, isSuccess } = useMutation({
    mutationFn: () => updateProfileSettings({ settings }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save layout settings' });
  useSuccessNotification({ isSuccess, message: 'Layout settings saved' });

  const handleOnClick = useCallback(async () => {
    saveSettings();
  }, [saveSettings]);

  return (
    <Tooltip title="Save layout settings">
      <IconButton size="small" onClick={handleOnClick}><SaveOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default SaveProfileButton;

