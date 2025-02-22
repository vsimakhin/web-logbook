import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchPdfDefaults } from "../../util/http/settings";

export const SECTION_PAGE_SETTINGS = "page";
export const SECTION_COLUMN_WIDTH = "columns";
export const SECTION_COLUMN_HEADER = "headers";

const TOOLTIP_MESSAGES = {
  [SECTION_PAGE_SETTINGS]: "Restore page settings defaults",
  [SECTION_COLUMN_WIDTH]: "Restore logbook columns width defaults",
  [SECTION_COLUMN_HEADER]: "Restore logbook columns headers defaults"
};

const PageSettingsFields = [
  "logbook_rows", "fill", "left_margin", "left_margin_a", "left_margin_b",
  "top_margin", "body_row_height", "footer_row_height", "page_breaks",
]

export const RestoreDefaultsButton = ({ format, section, handleChange }) => {
  const navigate = useNavigate();

  const { mutateAsync: restore, isError, error } = useMutation({
    mutationFn: () => fetchPdfDefaults({ format, navigate }),
    onSuccess: async (data) => {
      if (section === SECTION_PAGE_SETTINGS) {
        PageSettingsFields.forEach((field) => {
          handleChange(field, data[field]);
        });
      } else if (section === SECTION_COLUMN_WIDTH) {
        handleChange("columns", data.columns);
      } else if (section === SECTION_COLUMN_HEADER) {
        handleChange("headers", data.headers);
      }
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to fetch defaults' });

  const onRestore = async () => { await restore() }

  return (
    <>
      <Tooltip title={TOOLTIP_MESSAGES[section]}>
        <IconButton size="small" onClick={() => onRestore()}><SettingsBackupRestoreOutlinedIcon /></IconButton>
      </Tooltip>
    </>
  );
}

export default RestoreDefaultsButton;