import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchStandardFields } from "../../../util/http/settings";

export const RestoreDefaultsButton = ({ handleChange }) => {
  const navigate = useNavigate();

  const { mutateAsync: restore, isError, error } = useMutation({
    mutationFn: (signal) => fetchStandardFields({ signal, navigate }),
    onSuccess: async (data) => {
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          handleChange(key, value);
        });
      }
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to fetch default standard headers' });

  const onRestoreClick = useCallback(async () => {
    await restore();
  }, [restore]);

  return (
    <Tooltip title="Restore defaults">
      <IconButton size="small" onClick={onRestoreClick}><SettingsBackupRestoreOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default RestoreDefaultsButton;