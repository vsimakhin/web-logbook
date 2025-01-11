import { useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
// Custom
import { DownloadAttachmentButton } from './DownloadAttachmentButton';
import DeleteAttachmentButton from './DeleteAttachmentButton';

export const Attachment = ({ attachment }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => { setAnchorEl(event.currentTarget) };
  const handleClose = () => { setAnchorEl(null) };

  return (
    <>
      <Box>
        <IconButton onClick={handleClick} size="small"><AttachFileOutlinedIcon /></IconButton>
        {attachment.description ? `${attachment.description} - ` : ""}{attachment.document_name}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem onClick={() => console.log("preview")} sx={{ p: 0 }}><VisibilityOutlinedIcon sx={{ m: 1 }} color="action" />Preview</MenuItem>
        <DownloadAttachmentButton attachment={attachment} handleClose={handleClose} />
        <DeleteAttachmentButton attachment={attachment} handleClose={handleClose} />
      </Menu>
    </>
  );
}

export default Attachment;