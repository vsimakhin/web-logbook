import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";

export const NewFlightRecordButton = ({ setFlight }) => {
  const navigate = useNavigate();

  const handleNewFlight = useCallback(() => {
    navigate("/logbook/new");
    setFlight((flight) => (
      {
        ...FLIGHT_INITIAL_STATE,
        uuid: "new",
        date: flight.date,
        departure: {
          place: flight.arrival.place,
          time: ""
        },
      }
    ));
  }, [navigate, setFlight]);

  return (
    <Tooltip title="New flight record">
      <IconButton size="small" onClick={handleNewFlight}>
        <AddBoxOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default NewFlightRecordButton;