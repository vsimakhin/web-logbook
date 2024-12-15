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
          { path: 'logbook', element: <LogbookPage /> },
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