import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// MUI elements
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
// Custom
import { DRAWER_WIDTH } from '../constants/constants';
import { fetchVersion } from '../util/http/settings';

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

export const Root = () => {
  return (
    <DashboardLayout sidebarExpandedWidth={DRAWER_WIDTH} slots={{ appTitle: CustomAppTitle }}>
      <PageContainer maxWidth={false} title="" breadcrumbs={[]}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
};

export default Root;