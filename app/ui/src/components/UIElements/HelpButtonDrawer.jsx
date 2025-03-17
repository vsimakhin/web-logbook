import { useCallback, useMemo, useState } from "react";
// MUI Elements
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
// MUI Icons
import HelpCenterOutlinedIcon from '@mui/icons-material/HelpCenterOutlined';

const DRAWER_SX = {
  '& .MuiDrawer-paper': {
    marginTop: '64px',
    height: 'calc(100% - 64px)',
    boxSizing: 'border-box',
  },
};

export const HelpButtonDrawer = ({ content }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen((prevState) => !prevState);
  }, []);

  const formattedContent = useMemo(() => (
    content.map((item, index) => {
      const IconComponent = item.icon;

      return (
        <ListItem key={index} divider={true} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography>
            {item.title}{item.icon && <IconComponent sx={{ ml: 1 }} />}
          </Typography>
          <Typography component="p" sx={{ fontWeight: 'normal !important' }}>
            {item.description}
          </Typography>
        </ListItem>
      );
    })
  ), [content]);

  return (
    <>
      <Tooltip title="Help">
        <IconButton size="small" onClick={toggleHelp}><HelpCenterOutlinedIcon /></IconButton>
      </Tooltip>

      <Drawer anchor="right" open={isHelpOpen} onClose={toggleHelp} sx={DRAWER_SX}>
        <Box sx={{ width: 350, padding: 0, overflowY: 'auto' }}>
          {formattedContent}
        </Box>
      </Drawer>
    </>
  );
}

export default HelpButtonDrawer;