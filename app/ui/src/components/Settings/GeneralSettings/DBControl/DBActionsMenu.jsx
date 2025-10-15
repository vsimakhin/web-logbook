import { memo, useCallback, useState } from 'react';
// MUI UI elements
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import DBUploadButton from './DBUploadButton';
import DBDownloadButton from './DBDownloadButton';
// Custom

export const DBActionsMenu = memo(() => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);



  return (
    <>
      <Tooltip title="Database actions">
        <IconButton onClick={handleClick} size="small"><StorageOutlinedIcon /></IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <DBUploadButton handleCloseMenu={handleCloseMenu} />
        <DBDownloadButton handleCloseMenu={handleCloseMenu} />
      </Menu>
    </>
  );
});

export default DBActionsMenu;