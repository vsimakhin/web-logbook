import { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
// MUI
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
// Custom
import DashboardToolbar from '../components/UIElements/Dashboard/DashboardToolbar';
import DashboardNavbar from '../components/UIElements/Dashboard/DashboardNavbar';
import DashboardPageContent from '../components/UIElements/Dashboard/DashboardPageContent';
import { useLocalStorageState, CODE_BOOLEAN } from '../hooks/useLocalStorageState';

export const Root = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useLocalStorageState("dashboard-expanded", true, { codec: CODE_BOOLEAN });

  const handleMenuToggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen(o => !o);
    } else {
      setExpanded(e => !e);
    }
  }, [isMobile, setExpanded]);

  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <DashboardToolbar
        handleMenuToggle={handleMenuToggle}
        expanded={expanded}
        isMobile={isMobile}
      />

      <DashboardNavbar
        expanded={expanded}
        mobileOpen={mobileOpen}
        handleMobileClose={handleMobileClose}
        isMobile={isMobile}
      />

      <DashboardPageContent />
    </Box>
  );
};

export default Root;