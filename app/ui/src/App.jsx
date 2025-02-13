import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@toolpad/core/react-router-dom';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { DialogsProvider } from '@toolpad/core/useDialogs';
// MUI UI elements
import { createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
// Custom components and libraries
import { queryClient } from './util/http/http';
import { NAV_ITEMS } from './constants/constants';
import getMPTheme from './theme/getMPTheme';

const BRANDING = {
  title: 'WebLogbook',
  logo: ''
};

function App() {
  // theme
  const lightTheme = createTheme(getMPTheme('light'));
  const darkTheme = createTheme(getMPTheme('dark'));
  const theme = { light: lightTheme, dark: darkTheme };

  return (
    <AppProvider theme={theme} navigation={NAV_ITEMS} branding={BRANDING} >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <DialogsProvider>
            <NotificationsProvider>
              <Outlet />
            </NotificationsProvider>
          </DialogsProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </AppProvider>
  )
}

export default App
