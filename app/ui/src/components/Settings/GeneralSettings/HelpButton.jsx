// MUI Icons
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

// Custom
import HelpButtonDrawer from "../../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Settings",
    icon: SettingsIcon,
    description: "Configure general logbook settings and preferences.",
  },
  {
    title: "Logbook Pagination",
    description: "Set a custom number of rows displayed per page in the main logbook table.",
  },
  {
    title: "Person Roles",
    description: "Define and customize roles assigned to persons in the logbook.",
  },
  {
    title: "Time Fields Auto-format",
    description: "Automatically format time fields to maintain a consistent display format.",
  },
  {
    title: "License Expiration",
    description: "Set a custom warning period for license expiration and choose whether to display the warning in the navigation panel.",
  },
  {
    title: "Authentication",
    description: `Configure a username and password if your logbook is accessible from the internet. 
      The Secret Key is automatically generated and used to issue secure tokens.`,
  },
  {
    title: "Upload Database",
    icon: CloudUploadOutlinedIcon,
    description: `Upload a new database file (SQLite only). 
      ⚠️Caution⚠️ - this will overwrite the current database, make sure you have a backup.`,
  },
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;