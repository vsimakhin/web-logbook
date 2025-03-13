import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// pages
import { authLoader } from './util/auth.jsx';
import Root from './pages/Root';
import LogbookPage from './pages/LogbookPage.jsx';
import FlightRecordPage from './pages/FlightRecordPage.jsx';
import LicensingPage from './pages/LicensingPage.jsx';
import LicenseRecordPage from './pages/LicenseRecordPage.jsx';
import MapPage from './pages/MapPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import LogoutPage from './pages/LogoutPage.jsx';
import AircraftsPage from './pages/AircraftsPage.jsx';
import AirportsPage from './pages/AirportsPage.jsx';
import StatsDashboardPage from './pages/StatsDashboardPage.jsx';
import StatsByYearPage from './pages/StatsByYearPage.jsx';
import StatsByTypePage from './pages/StatsByTypePage.jsx';
import StatsByCategoryPage from './pages/StatsByCategoryPage.jsx';
import PdfExportA4Page from './pages/PdfExportA4Page.jsx';
import PdfExportA5Page from './pages/PdfExportA5Page.jsx';
import ImportPage from './pages/ImportPage.jsx';

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: Root,
        id: 'root',
        loader: authLoader,
        children: [
          { index: true, element: <LogbookPage /> },
          {
            path: 'logbook', children: [
              { index: true, element: <LogbookPage /> },
              { path: ":id", element: <FlightRecordPage /> }
            ]
          },
          {
            path: 'licensing', children: [
              { index: true, element: <LicensingPage /> },
              { path: ":id", element: <LicenseRecordPage /> }
            ]
          },
          { path: 'map', element: <MapPage /> },
          { path: 'aircrafts', element: <AircraftsPage /> },
          { path: 'airports', element: <AirportsPage /> },
          {
            path: 'stats', children: [
              { index: true, element: <StatsDashboardPage /> },
              { path: 'dashboard', element: <StatsDashboardPage /> },
              { path: 'by-year', element: <StatsByYearPage /> },
              { path: 'by-type', element: <StatsByTypePage /> },
              { path: 'by-category', element: <StatsByCategoryPage /> },
            ]
          },
          {
            path: 'export', children: [
              { index: true, element: <PdfExportA4Page /> },
              { path: 'a4', element: <PdfExportA4Page /> },
              { path: 'a5', element: <PdfExportA5Page /> },
            ]
          },
          {
            path: 'import', element: <ImportPage />,
          },
          { path: 'settings', element: <SettingsPage /> },
        ]
      },
      { path: '/signin', element: <SignInPage /> },
      { path: '/logout', element: <LogoutPage /> }
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)