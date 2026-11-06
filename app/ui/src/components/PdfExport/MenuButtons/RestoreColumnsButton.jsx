import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import { fetchPdfDefaults } from "../../../util/http/settings";
import { useErrorNotification } from "../../../hooks/useAppNotifications";

const TABLE_COLUMNS_PATH = 'table_profile.table_columns';
const HIDDEN_COLUMNS_PATH = 'table_profile.table_hidden_columns';
const COLUMN_WIDTHS_PATH = 'table_profile.table_column_widths';

export const RestoreColumnsButton = ({ format, handleChange }) => {
  const { mutateAsync: restore, isError, error } = useMutation({
    mutationFn: () => fetchPdfDefaults({ format }),
    onSuccess: async (data) => {
      handleChange(COLUMN_WIDTHS_PATH, data.table_profile.table_column_widths);
      handleChange(TABLE_COLUMNS_PATH, []);
      handleChange(HIDDEN_COLUMNS_PATH, []);
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to fetch defaults' });

  const handleReset = useCallback(async () => {
    await restore();
  }, [restore]);

  return (
    <Tooltip title="Restore column order and visibility">
      <IconButton size="small" onClick={handleReset}>
        <SettingsBackupRestoreOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default RestoreColumnsButton;