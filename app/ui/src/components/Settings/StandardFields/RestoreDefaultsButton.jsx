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
import { queryClient } from "../../../util/http/http";

export const RestoreDefaultsButton = () => {
  const navigate = useNavigate();

  const { mutateAsync: restore, isError, error } = useMutation({
    mutationFn: () => console.log("restoring default..."),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to fetch defaults' });

  const onRestoreClick = useCallback(() => {
    restore()
  }, [restore]);

  return (
    <Tooltip title="Restore defaults">
      <IconButton size="small" onClick={onRestoreClick}><SettingsBackupRestoreOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default RestoreDefaultsButton;