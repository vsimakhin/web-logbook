import { useCallback, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
// MUI Icons
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
// Custom
import { DownloadAttachmentButton } from './DownloadAttachmentButton';
import DeleteAttachmentButton from './DeleteAttachmentButton';
import ConvertAttachmentToTrackButton from './ConvertAttachmentToTrackButton';

export const Attachment = ({ attachment }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = useCallback((event) => { setAnchorEl(event.currentTarget) }, []);
  const handleClose = useCallback(() => { setAnchorEl(null) }, []);

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
        {attachment.document_name.endsWith(".kml") && (
          <ConvertAttachmentToTrackButton attachment={attachment} handleClose={handleClose} />
        )}
        <DownloadAttachmentButton attachment={attachment} handleClose={handleClose} />
        <DeleteAttachmentButton attachment={attachment} handleClose={handleClose} />
      </Menu>
    </>
  );
}

export default Attachment;