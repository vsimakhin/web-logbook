import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchPdfDefaults } from "../../util/http/settings";

const SECTION_PAGE_SETTINGS = "page";
const SECTION_COLUMN_WIDTH = "columns";
const SECTION_COLUMN_HEADER = "headers";

const PageSettingsFields = [
  "logbook_rows", "fill", "left_margin", "left_margin_a", "left_margin_b",
  "top_margin", "body_row_height", "footer_row_height", "page_breaks",
]

export const RestoreDefaultsButton = ({ format, handleChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => { setAnchorEl(event.currentTarget) };
  const handleClose = () => { setAnchorEl(null) };
  const [section, setSection] = useState();

  const { mutateAsync: restore, isError, error } = useMutation({
    mutationFn: () => fetchPdfDefaults({ format }),
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

  const onRestore = async (section) => {
    setSection(section);
    await restore();
    handleClose();
  }

  return (
    <>
      <Tooltip title="Restore defaults">
        <IconButton size="small" onClick={handleClick}><SettingsBackupRestoreOutlinedIcon /></IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem sx={{ p: 0 }} onClick={() => onRestore(SECTION_PAGE_SETTINGS)}>
          <IconButton size="small"><SettingsBackupRestoreOutlinedIcon /></IconButton>Restore Page Settings
        </MenuItem>
        <MenuItem sx={{ p: 0 }} onClick={() => onRestore(SECTION_COLUMN_WIDTH)}>
          <IconButton size="small"><SettingsBackupRestoreOutlinedIcon /></IconButton>Restore Columns Width
        </MenuItem>
        <MenuItem sx={{ p: 0 }} onClick={() => onRestore(SECTION_COLUMN_HEADER)}>
          <IconButton size="small"><SettingsBackupRestoreOutlinedIcon /></IconButton>Restore Columns Headers
        </MenuItem>
      </Menu>
    </>
  );
}

export default RestoreDefaultsButton;