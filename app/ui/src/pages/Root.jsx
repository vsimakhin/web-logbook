import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// MUI elements
import { DashboardLayout, ThemeSwitcher } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// MUI Icon
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
// Custom
import { DRAWER_WIDTH } from '../constants/constants';
import { fetchAuthEnabled, fetchVersion } from '../util/http/settings';

const CustomAppTitle = () => {
  const navigate = useNavigate();

  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: ({ signal }) => fetchVersion({ signal, navigate }),
    placeholderData: "",
    staleTime: 86400000,
    cacheTime: 86400000,
    refetchOnWindowFocus: false,
  });

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography variant="h6">Logbook</Typography>
      <Chip size="small" label={version} color="error" />
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
    cacheTime: 86400000,
    refetchOnWindowFocus: false,
  });

  const handleLogout = () => {
    navigate('/logout');
  }

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