import { Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { DialogsProvider } from '@toolpad/core/useDialogs';
// MUI Icons
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
import PersonIcon from '@mui/icons-material/Person';
// MUI UI elements
import { createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
// Custom components and libraries
import { queryClient } from './util/http/http';
import getMPTheme from './theme/getMPTheme';
import { LicensingNavTitle } from './components/Licensing/LicensingNavTitle';

const BRANDING = {
  title: 'WebLogbook',
  logo: ''
};

const NAV_ITEMS = [
  { segment: 'logbook', title: 'Logbook', icon: <AutoStoriesOutlinedIcon /> },
  { segment: 'licensing', title: <LicensingNavTitle />, icon: <ContactPageOutlinedIcon /> },
  { segment: 'map', title: 'Map', icon: <MapOutlinedIcon /> },
  { segment: 'aircrafts', title: 'Aircrafts', icon: <FlightOutlinedIcon /> },
  { segment: 'airports', title: 'Airports', icon: <FlightTakeoffOutlinedIcon /> },
  { segment: 'persons', title: 'Persons', icon: <PersonIcon /> },
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
  { kind: 'divider' },
];

function App() {
  // theme
  const lightTheme = createTheme(getMPTheme('light'));
  const darkTheme = createTheme(getMPTheme('dark'));
  const theme = { light: lightTheme, dark: darkTheme };

  return (
    <ReactRouterAppProvider theme={theme} navigation={NAV_ITEMS} branding={BRANDING} >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <DialogsProvider>
            <NotificationsProvider>
              <Outlet />
            </NotificationsProvider>
          </DialogsProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ReactRouterAppProvider>
  )
}

export default App
