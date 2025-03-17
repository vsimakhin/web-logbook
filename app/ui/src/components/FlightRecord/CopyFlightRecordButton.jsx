import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useNotifications } from '@toolpad/core/useNotifications';

export const CopyFlightRecordButton = ({ setFlight }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const handleNewFlight = useCallback(() => {
    const message = "Flight record copied. Update the details and save.";

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
  }, [navigate, setFlight, notifications]);

  return (
    <Tooltip title="Copy flight record">
      <IconButton size="small" onClick={handleNewFlight}>
        <ContentCopyOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default CopyFlightRecordButton;