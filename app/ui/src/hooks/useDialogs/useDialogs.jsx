import { createContext, useCallback, useContext, useRef, useState } from 'react';
// MUI
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

const DialogsContext = createContext(null);

const severityColor = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success',
};

const AlertDialog = ({ open, onClose, payload }) => {
  const { msg, title = 'Alert', okText = 'OK', severity } = payload;
  const okColor = severityColor[severity] ?? 'primary';

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{msg}</DialogContent>
      <DialogActions>
        <Button color={okColor} onClick={() => onClose()} autoFocus>{okText}</Button>
      </DialogActions>
    </Dialog>
  );
}

const ConfirmDialog = ({ open, onClose, payload }) => {
  const { msg, title = 'Confirm', okText = 'OK', cancelText = 'Cancel', severity } = payload;
  const okColor = severityColor[severity] ?? 'primary';

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{msg}</DialogContent>
      <DialogActions>
        <Button autoFocus onClick={() => onClose(false)}>{cancelText}</Button>
        <Button color={okColor} onClick={() => onClose(true)}>{okText}</Button>
      </DialogActions>
    </Dialog>
  );
}

export const DialogsProvider = ({ children }) => {
  const [stack, setStack] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((Component, payload) => {
    return new Promise((resolve) => {
      const id = ++idRef.current;
      setStack((prev) => [...prev, { id, Component, payload, open: true, resolve }]);
    });
  }, []);

  const dismiss = useCallback((id, result) => {
    setStack((prev) =>
      prev.map((d) => (d.id === id ? { ...d, open: false } : d))
    );
    setTimeout(() => {
      setStack((prev) => {
        const entry = prev.find((d) => d.id === id);
        if (entry) entry.resolve(result);
        return prev.filter((d) => d.id !== id);
      });
    }, 300);
  }, []);

  const alert = useCallback((msg, options = {}) => push(AlertDialog, { msg, ...options }), [push]);
  const confirm = useCallback((msg, options = {}) => push(ConfirmDialog, { msg, ...options }), [push]);
  const open = useCallback((Component, payload) => push(Component, payload), [push]);

  const close = useCallback(
    (_dialogPromise, result) => {
      setStack((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        dismiss(last.id, result);
        return prev;
      });
      return Promise.resolve();
    },
    [dismiss]
  );

  const api = { alert, confirm, open, close };

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {stack.map(({ id, Component, payload, open: isOpen }) => (
        <Component
          key={id}
          open={isOpen}
          onClose={(result) => dismiss(id, result)}
          payload={payload}
        />
      ))}
    </DialogsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDialogs = () => {
  const ctx = useContext(DialogsContext);
  if (!ctx) {
    throw new Error('useDialogs must be used within a <DialogsProvider>');
  }
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export default useDialogs;
