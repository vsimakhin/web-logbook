import { useNavigate } from 'react-router-dom';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";

export const NewFlightRecordButton = ({ setFlight }) => {
  const navigate = useNavigate();

  const handleNewFlight = () => {
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
  }

  return (
    <Tooltip title="New flight record">
      <IconButton size="small" onClick={handleNewFlight}><AddBoxOutlinedIcon /></IconButton>
    </Tooltip>
  )
}


export default NewFlightRecordButton;