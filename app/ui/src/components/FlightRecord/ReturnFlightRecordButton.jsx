import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// MUI Icons
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import { useNotifications } from '../../hooks/useNotifications/useNotifications';

export const ReturnFlightRecordButton = ({ flight, handleCloseMenu }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const handleNewFlight = useCallback(() => {
    handleCloseMenu();
    const departureTime = flight.departure?.time;
    const arrivalTime = flight.arrival?.time;
    const isNextDay = departureTime && arrivalTime && arrivalTime < departureTime;

    const state = {
      date: dayjs(flight.date, "DD/MM/YYYY").add(isNextDay ? 1 : 0, "day").format("DD/MM/YYYY"),
      departure: {
        place: flight.arrival.place,
        time: ""
      },
      arrival: {
        place: flight.departure.place,
        time: ""
      },
      aircraft: flight.aircraft,
      pic_name: flight.pic_name,
      copy_persons: flight.uuid,
    };

    navigate("/logbook/new", { state: state });

    const message = "Return Flight record copied. Update the details and save.";
    notifications.show(message, { severity: "success", key: "flightrecord-return", autoHideDuration: 5000 });
  }, [flight.date, flight.arrival, flight.departure, flight.aircraft, flight.pic_name, flight.uuid, handleCloseMenu, navigate, notifications]);

  return (
    <MenuItem sx={{ p: 0, pr: 1 }} onClick={handleNewFlight}>
      <AssignmentReturnOutlinedIcon color="action" sx={{ m: 1 }} />Return
    </MenuItem>
  )
}

export default ReturnFlightRecordButton;