import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState({});

  const show = useCallback((msg, opts = {}) => {
    setMessage(msg);
    setOptions(opts);
    setOpen(true);
  }, []);

  const close = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  }, []);

  const contextValue = useMemo(() => ({ show }), [show]);

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={options.autoHideDuration ?? 3000}
        onClose={close}
        anchorOrigin={options.anchorOrigin ?? { vertical: 'bottom', horizontal: 'left' }}
        key={options.key ?? message}
      >
        <Alert
          onClose={close}
          severity={options.severity ?? 'info'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
