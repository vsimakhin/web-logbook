import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// pages
import Root from './pages/Root';
import LogbookPage from './pages/LogbookPage.jsx';
import FlightRecordPage from './pages/FlightRecordPage.jsx';
import LicensingPage from './pages/LicensingPage.jsx';
import LicenseRecordPage from './pages/LicenseRecordPage.jsx';
import MapPage from './pages/MapPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: Root,
        id: 'root',
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
          { path: 'settings', element: <SettingsPage /> },
        ]
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)