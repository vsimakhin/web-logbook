import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewFlightRecordButton = ({ flight, handleCloseMenu }) => {
  const navigate = useNavigate();

  const handleNewFlight = useCallback(() => {
    handleCloseMenu();
    navigate("/logbook/new", {
      state: {
        date: flight.date,
        departure: {
          place: flight.arrival.place,
          time: ""
        }
      }
    });
  }, [flight.arrival.place, flight.date, handleCloseMenu, navigate]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleNewFlight}>
      <AddBoxOutlinedIcon color="action" sx={{ m: 1 }} />New
    </MenuItem>
  )
}

export default NewFlightRecordButton;