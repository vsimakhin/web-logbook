import { useCallback, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
// MUI Icons
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
// Custom
import DownloadAttachmentButton from './DownloadAttachmentButton';
import DeleteAttachmentButton from './DeleteAttachmentButton';
import ConvertAttachmentToTrackButton from './ConvertAttachmentToTrackButton';
import AttachmentPreview from './AttachmentPreview';

export const Attachment = ({ attachment }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);
  const handleOpenPreview = useCallback(() => setPreviewOpen(true), []);
  const handleClosePreview = useCallback(() => setPreviewOpen(false), []);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleClick} size="small"><AttachFileOutlinedIcon /></IconButton>
        <Typography variant="body2" onClick={handleOpenPreview} sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
          {attachment.document_name}
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {attachment.document_name.endsWith(".kml") && (
          <ConvertAttachmentToTrackButton attachment={attachment} handleClose={handleCloseMenu} />
        )}
        <DownloadAttachmentButton attachment={attachment} handleClose={handleCloseMenu} />
        <DeleteAttachmentButton attachment={attachment} handleClose={handleCloseMenu} />
      </Menu>

      <AttachmentPreview
        attachment={attachment}
        open={previewOpen}
        onClose={handleClosePreview}
      />
    </>
  );
};

export default Attachment;