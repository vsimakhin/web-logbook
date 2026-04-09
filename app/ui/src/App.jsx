import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { useNavigate, Outlet } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
// MUI UI elements
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// Custom components and libraries
import { queryClient } from './util/http/http';
import getMPTheme from './theme/getMPTheme';
import { setNavigate } from './util/navigation';
import { ColorModeContext } from './context/ColorModeContext';
import { DialogsProvider } from './hooks/useDialogs/useDialogs';

dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

function NavigationSetter() {
  const navigate = useNavigate();
  setNavigate(navigate);
  return null;
}

function App() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  const colorMode = useMemo(() => ({
    mode,
    toggleColorMode: () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('themeMode', next);
        return next;
      });
    },
  }), [mode]);

  const theme = useMemo(() => createTheme(getMPTheme(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavigationSetter />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <QueryClientProvider client={queryClient}>
            <NotificationsProvider>
              <DialogsProvider>
                <Outlet />
              </DialogsProvider>
            </NotificationsProvider>
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
