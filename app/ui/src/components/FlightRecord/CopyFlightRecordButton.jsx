import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useNotifications } from '@toolpad/core/useNotifications';

export const CopyFlightRecordButton = ({ setFlight, handleCloseMenu }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const handleCopyFlight = useCallback(() => {
    const message = "Flight record copied. Update the details and save.";

    handleCloseMenu();
    navigate("/logbook/new");
    setFlight((flight) => (
      {
        ...flight,
        uuid: "new",
      }
    ));
    notifications.show(message, {
      severity: "success",
      key: "flightrecord-copy",
      autoHideDuration: 3000,
    });
  }, [handleCloseMenu, navigate, setFlight, notifications]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleCopyFlight}>
      <ContentCopyOutlinedIcon color="action" sx={{ m: 1 }} />Copy
    </MenuItem>
  )
}

export default CopyFlightRecordButton;