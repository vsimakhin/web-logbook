import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { compareVersions } from 'compare-versions';
// MUI elements
import { DashboardLayout, ThemeSwitcher } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
// MUI Icon
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
// Custom
import { DRAWER_WIDTH } from '../constants/constants';
import { fetchAuthEnabled, fetchLatestRelease, fetchVersion } from '../util/http/settings';

const CustomAppTitle = () => {
  const navigate = useNavigate();
  const [isNewReleaseAvailable, setIsNewReleaseAvailable] = useState(false);

  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: ({ signal }) => fetchVersion({ signal, navigate }),
    placeholderData: "",
    staleTime: 86400000,
    gcTime: 86400000,
    refetchOnWindowFocus: false,
  });

  const { data: latestRelease } = useQuery({
    queryKey: ['latestRelease'],
    queryFn: ({ signal }) => fetchLatestRelease({ signal }),
    staleTime: 604800000, // 7 days
    gcTime: 604800000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (version && latestRelease?.tag_name) {
      setIsNewReleaseAvailable(compareVersions(latestRelease.tag_name, version) === 1);
    }
  }, [version, latestRelease?.tag_name]);

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography variant="h6">Logbook</Typography>
      <Badge color="primary" badgeContent={"New"} invisible={!isNewReleaseAvailable}>
        <Chip size="small" label={version} color="success" variant="outlined"
          component="a" href="https://github.com/vsimakhin/web-logbook/releases"
          clickable target="_blank" rel="noopener noreferrer"
        />
      </Badge>
    </Stack>
  );
}

const ToolbarActions = () => {
  const navigate = useNavigate();

  const { data: auth } = useQuery({
    queryKey: ['auth-enabled'],
    queryFn: ({ signal }) => fetchAuthEnabled({ signal, navigate }),
    placeholderData: false,
    staleTime: 86400000,
    gcTime: 86400000,
    refetchOnWindowFocus: false,
  });

  const handleLogout = useCallback(() => {
    navigate('/logout');
  }, [navigate]);

  return (
    <Stack direction="row" spacing={0}>
      {auth &&
        <Tooltip title="Logout">
          <IconButton onClick={handleLogout}><MeetingRoomIcon htmlColor="rgb(0, 89, 179)" /></IconButton>
        </Tooltip>
      }
      <ThemeSwitcher />
    </Stack>
  );
}

export const Root = () => {
  return (
    <DashboardLayout sidebarExpandedWidth={DRAWER_WIDTH}
      slots={{
        appTitle: CustomAppTitle,
        toolbarActions: ToolbarActions
      }}>
      <PageContainer maxWidth={false} title="" breadcrumbs={[]}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
};

export default Root;