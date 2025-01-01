import { useState } from "react";
// MUI Elements
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
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
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>New flight record <AddBoxOutlinedIcon /></Box>
            Creates a new flight record with the departure field equal to the arrival field of the current flight<br />
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>Copy flight record <ContentCopyOutlinedIcon /></Box>
            Creates a new flight record with the same values as the current flight<br />
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>PIC Name</Box>
            Double-click the field to set its value to &apos;Self&apos;<br />
            <Box component="li" sx={{ fontWeight: 'bold', mt: 1 }}>Time fields</Box>
            Double-click the field copies value from &apos;Total time&apos; field<br />
          </ul>
        </Box>
      </Drawer>
    </>
  );
}

export default HelpButton;