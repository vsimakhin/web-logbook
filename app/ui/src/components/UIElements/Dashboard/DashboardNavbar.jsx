import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme, styled } from '@mui/material/styles';
// MUI
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
// MUI Icons
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import SaveAltOutlinedIcon from '@mui/icons-material/SaveAltOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import FlightOutlinedIcon from '@mui/icons-material/FlightOutlined';
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import SecurityUpdateGoodOutlinedIcon from '@mui/icons-material/SecurityUpdateGoodOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import LicensingNavTitle from '../../Licensing/LicensingNavTitle';
// Custom
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../../../constants/constants';

const NAV_ITEMS = [
  { segment: 'logbook', title: 'Logbook', icon: <AutoStoriesOutlinedIcon /> },
  { segment: 'licensing', title: (<>Licensing <LicensingNavTitle /></>), miniTitle: 'Licensing', icon: <ContactPageOutlinedIcon /> },
  { segment: 'map', title: 'Map', icon: <MapOutlinedIcon /> },
  { segment: 'aircrafts', title: 'Aircrafts', icon: <FlightOutlinedIcon /> },
  { segment: 'airports', title: 'Airports', icon: <FlightTakeoffOutlinedIcon /> },
  { segment: 'persons', title: 'Persons', icon: <PersonOutlinedIcon /> },
  { segment: 'attachments', title: 'Attachments', icon: <AttachFileOutlinedIcon /> },
  { kind: 'divider' },
  {
    segment: 'stats', title: 'Stats', icon: <QueryStatsOutlinedIcon />, children: [
      { segment: 'dashboard', title: 'Dashboard', icon: <GridViewOutlinedIcon /> },
      { segment: 'by-year', title: 'Year', icon: <CalendarMonthOutlinedIcon /> },
      { segment: 'by-type', title: 'Type', icon: <FlightOutlinedIcon /> },
      { segment: 'by-category', title: 'Category', icon: <CategoryOutlinedIcon /> },
    ],
  },
  { segment: 'currency', title: 'Currency', icon: <SecurityUpdateGoodOutlinedIcon /> },
  { kind: 'divider' },
  {
    segment: 'export', title: 'Export', icon: <SaveAltOutlinedIcon />, children: [
      { segment: 'a4', title: 'PDF A4', icon: <PictureAsPdfOutlinedIcon /> },
      { segment: 'a5', title: 'PDF A5', icon: <PictureAsPdfOutlinedIcon /> },
    ]
  },
  { segment: 'import', title: 'Import', icon: <FileUploadOutlinedIcon /> },
  { kind: 'divider' },
  { segment: 'settings', title: 'Settings', icon: <SettingsIcon /> },
];

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'expanded' })(({ theme, expanded }) => ({
  width: expanded ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: expanded ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: expanded
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
    boxSizing: 'border-box',
  },
}));

// A flat list of children rendered inside a popover (always "expanded" visually)
const PopoverNavItems = ({ items, onClose, basePath = '' }) => {
  const location = useLocation();
  const theme = useTheme();

  return (
    <Paper elevation={3}>
      <List sx={{ minWidth: 160, py: 0.5 }}>
        {items.map((child) => {
          const fullPath = `${basePath}/${child.segment}`;
          const isSelected = child.segment && location.pathname.startsWith(fullPath);
          return (
            <ListItem key={child.segment} disablePadding>
              <ListItemButton
                component={Link}
                to={fullPath}
                onClick={onClose}
                sx={{ px: 2, backgroundColor: isSelected ? theme.palette.action.selected : 'transparent' }}
              >
                <ListItemIcon sx={{ minWidth: 32, '& .MuiSvgIcon-root': { color: isSelected ? 'primary.dark' : 'inherit' } }}>
                  {child.icon}
                </ListItemIcon>
                <ListItemText>
                  {child.title}
                </ListItemText>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

const NavItem = ({ item, depth = 0, expanded, onClose, basePath = '' }) => {
  const [collapseOpen, setCollapseOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const theme = useTheme();

  if (item.kind === 'divider') {
    return <Divider sx={{ my: 0.5 }} />;
  }

  const fullPath = item.segment ? `${basePath}/${item.segment}` : basePath;
  const hasChildren = item.children?.length > 0;
  const isSelected = item.segment && location.pathname.startsWith(fullPath);

  const handleClick = (e) => {
    if (hasChildren) {
      if (expanded) {
        setCollapseOpen(o => !o);
      } else {
        // Mini mode: open popover to the right
        setAnchorEl(e.currentTarget);
      }
    } else if (onClose) {
      onClose();
    }
  };

  const handlePopoverClose = () => setAnchorEl(null);
  const popoverOpen = Boolean(anchorEl);

  return (
    <>
      <ListItem disablePadding sx={{ display: 'block', mt: 0 }}>
        <ListItemButton
          component={hasChildren ? 'div' : Link}
          to={hasChildren ? undefined : fullPath}
          onClick={handleClick}
          sx={{
            minHeight: expanded ? 44 : 56,
            flexDirection: expanded ? 'row' : 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: expanded ? 1.5 : 0.5,
            pl: expanded ? 1.5 + depth * 2 : 0.5,
            py: expanded ? 1 : 0.5,
            backgroundColor: isSelected ? theme.palette.action.selected : 'transparent',
          }}
        >
          {/* Icon — with tooltip only when expanded (label is visible when collapsed) */}
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: expanded ? 1 : 0,
              justifyContent: 'center',
              color: isSelected ? 'primary.dark' : 'inherit',
              '& .MuiSvgIcon-root': { color: isSelected ? 'primary.dark' : 'inherit' },
            }}
          >
            {item.icon}
          </ListItemIcon>

          {/* Label text */}
          {expanded ? (
            <>
              <ListItemText
                sx={{
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'primary.dark' : 'inherit',
                  m: 0,
                }}
              >
                {item.title}
              </ListItemText>
              {hasChildren && (collapseOpen ? <ExpandLess /> : <ExpandMore />)}
            </>
          ) : (
            <Typography
              component="span"
              sx={{
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                textAlign: 'center',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'primary.dark' : 'text.secondary',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              {/* Simplified title for mini mode if it's a JSX element */}
              {typeof item.title === 'string' ? item.title : item.miniTitle || ''}
            </Typography>
          )}
        </ListItemButton>
      </ListItem>

      {/* Expanded inline submenu */}
      {hasChildren && expanded && (
        <Collapse in={collapseOpen} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.children.map((child) => (
              <NavItem key={child.segment} item={child} depth={depth + 1} expanded={expanded} onClose={onClose} basePath={fullPath} />
            ))}
          </List>
        </Collapse>
      )}

      {/* Mini mode: popover submenu anchored to the icon */}
      {hasChildren && !expanded && (
        <Popover
          open={popoverOpen}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { ml: 0.5 } } }}
        >
          <PopoverNavItems items={item.children} onClose={handlePopoverClose} basePath={fullPath} />
        </Popover>
      )}
    </>
  );
};

const DrawerContent = ({ expanded, onClose }) => (
  <Box sx={{ overflowX: 'hidden', overflowY: 'auto', flexGrow: 1 }}>
    <List dense disablePadding>
      {NAV_ITEMS.map((item, index) => (
        <NavItem
          key={item.segment || `divider-${index}`}
          item={item}
          expanded={expanded}
          onClose={onClose}
        />
      ))}
    </List>
  </Box>
);

export const DashboardNavbar = ({ expanded, mobileOpen, handleMobileClose, isMobile }) => {
  return (
    <>
      {/* Mobile: temporary drawer (hides completely) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          <Toolbar />
          <DrawerContent expanded={true} onClose={handleMobileClose} />
        </Drawer>
      )}

      {/* Desktop: mini permanent drawer */}
      {!isMobile && (
        <StyledDrawer variant="permanent" expanded={expanded}>
          <Toolbar />
          <DrawerContent expanded={expanded} onClose={null} />
        </StyledDrawer>
      )}
    </>
  );
}

export default DashboardNavbar;