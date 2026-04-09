import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { compareVersions } from 'compare-versions';
// MUI
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
// MUI Icons
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
// Custom
import { fetchAuthEnabled, fetchLatestRelease, fetchVersion } from '../../../util/http/settings';
import ThemeSwitcher from './ThemeSwitcher';


const AppTitle = () => {
  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: ({ signal }) => fetchVersion({ signal }),
    placeholderData: '',
    staleTime: 86400000,
    gcTime: 86400000,
    refetchOnWindowFocus: false,
  });

  const { data: latestRelease } = useQuery({
    queryKey: ['latestRelease'],
    queryFn: ({ signal }) => fetchLatestRelease({ signal }),
    staleTime: 604800000,
    gcTime: 604800000,
    refetchOnWindowFocus: false,
  });

  const isNewReleaseAvailable = useMemo(() => (
    version && latestRelease?.tag_name
      ? compareVersions(latestRelease.tag_name, version) === 1
      : false), [version, latestRelease]);

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography variant="h6">Logbook</Typography>
      <Badge color="primary" badgeContent="New" invisible={!isNewReleaseAvailable}>
        <Chip
          size="small" label={version} color="success" variant="outlined"
          component="a" href="https://github.com/vsimakhin/web-logbook/releases"
          clickable target="_blank" rel="noopener noreferrer"
        />
      </Badge>
    </Stack>
  );
};

const ToolbarActions = () => {
  const navigate = useNavigate();

  const { data: auth } = useQuery({
    queryKey: ['auth-enabled'],
    queryFn: ({ signal }) => fetchAuthEnabled({ signal }),
    placeholderData: false,
    staleTime: 86400000,
    gcTime: 86400000,
    refetchOnWindowFocus: false,
  });

  const handleLogout = useCallback(() => navigate('/logout'), [navigate]);

  return (
    <Stack direction="row" spacing={0} alignItems="center">
      {auth && (
        <Tooltip title="Logout">
          <IconButton onClick={handleLogout}>
            <MeetingRoomIcon />
          </IconButton>
        </Tooltip>
      )}
      <ThemeSwitcher />
    </Stack>
  );
};

export const DashboardToolbar = ({ handleMenuToggle, expanded, isMobile }) => {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{ zIndex: 30000, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar>
        <IconButton edge="start" aria-label="toggle drawer" onClick={handleMenuToggle} sx={{ mr: 1 }}>
          {(!isMobile && expanded) ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <AppTitle />
        </Box>
        <ToolbarActions />
      </Toolbar>
    </AppBar>
  )
}

export default DashboardToolbar;