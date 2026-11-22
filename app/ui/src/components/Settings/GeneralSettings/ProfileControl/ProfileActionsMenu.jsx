import { useState } from 'react';
// MUI UI elements
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip'
// MUI Icons
import PortraitOutlinedIcon from '@mui/icons-material/PortraitOutlined';
// Custom
import ProfileDownloadButton from './ProfileDownloadButton';
import ProfileUploadButton from './ProfileUploadButton';

export const ProfileActionsMenu = ({ settings }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Profile actions">
        <IconButton onClick={handleClick} size="small"><PortraitOutlinedIcon /></IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <ProfileUploadButton handleCloseMenu={handleCloseMenu} />
        <ProfileDownloadButton settings={settings} handleCloseMenu={handleCloseMenu} />
      </Menu>
    </>
  );
};

export default ProfileActionsMenu;