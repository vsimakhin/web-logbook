import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";

export const NewFlightRecordButton = ({ setFlight, handleCloseMenu }) => {
  const navigate = useNavigate();

  const handleNewFlight = useCallback(() => {
    handleCloseMenu();
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
  }, [handleCloseMenu, navigate, setFlight]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleNewFlight}>
      <AddBoxOutlinedIcon color="action" sx={{ m: 1 }} />New
    </MenuItem>
  )
}

export default NewFlightRecordButton;