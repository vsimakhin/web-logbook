import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

export const DashboardPageContent = () => {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 1, overflow: 'auto', minWidth: 0 }}>
      <Toolbar />
      <Outlet />
    </Box>
  );
};

export default DashboardPageContent;