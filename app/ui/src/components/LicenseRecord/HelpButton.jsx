import { useState } from "react";
// MUI Elements
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import FolderDeleteOutlinedIcon from '@mui/icons-material/FolderDeleteOutlined';
import HelpCenterOutlinedIcon from '@mui/icons-material/HelpCenterOutlined';

export const HelpButton = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <Tooltip title="Help">
        <IconButton size="small" onClick={() => setIsHelpOpen(true)}><HelpCenterOutlinedIcon /></IconButton>
      </Tooltip>

      <Drawer anchor="right" open={isHelpOpen} onClose={() => setIsHelpOpen(false)} sx={{
        '& .MuiDrawer-paper': {
          marginTop: '64px',
          height: 'calc(100% - 64px)',
        },
      }}>
        <Box sx={{ width: 350, padding: 0 }}>
          <ul>
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>License Record Preview</Box>
            Shows preview for PDF and image attached files.<br />
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>Delete Attachment <FolderDeleteOutlinedIcon /></Box>
            Deletes attachment for the license record<br />
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>Download attachment <CloudDownloadOutlinedIcon /></Box>
            Downloads attachment<br />
          </ul>
        </Box>
      </Drawer>
    </>
  );
}

export default HelpButton;