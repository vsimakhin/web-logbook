import { Outlet } from 'react-router-dom';
// MUI elements
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
// Custom
import { DRAWER_WIDTH } from '../constants/constants';

const CustomAppTitle = () => {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography variant="h6">Logbook</Typography>
      <Chip size="small" label="Alpha" color="error" />
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