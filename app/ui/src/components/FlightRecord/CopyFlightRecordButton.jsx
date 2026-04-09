import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useNotifications } from '../../hooks/useNotifications/useNotifications';

export const CopyFlightRecordButton = ({ flight, handleCloseMenu }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const handleCopyFlight = useCallback(() => {
    const message = "Flight record copied. Update the details and save.";

    handleCloseMenu();
    navigate("/logbook/new", { state: { ...flight, uuid: "new" } });

    notifications.show(message, { severity: "success", key: "flightrecord-copy", autoHideDuration: 5000 });
  }, [handleCloseMenu, navigate, notifications, flight]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleCopyFlight}>
      <ContentCopyOutlinedIcon color="action" sx={{ m: 1 }} />Copy
    </MenuItem>
  )
}

export default CopyFlightRecordButton;