import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
// MUI Icons
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
// Custom
import CardHeader from "../UIElements/CardHeader";
import DatePicker from '../UIElements/DatePicker';
import TextField from '../UIElements/TextField';
import Label from '../UIElements/Label';
import { FLIGHT_INITIAL_STATE, PLACE_SLOT_PROPS, TIME_SLOT_PROPS } from '../../constants/constants';
import AircraftType from './AircraftType';

export const FlightRecordDetails = ({ flightData }) => {
  const [flight, setFlight] = useState(flightData || FLIGHT_INITIAL_STATE);

  useEffect(() => {
    if (flightData) {
      setFlight(flightData);
    }
  }, [flightData]);

  const handleChange = (key, value) => {
    setFlight((flight) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedFlight = { ...flight }; // Create a shallow copy of the flight object
      let current = updatedFlight;

      // Traverse and create nested objects as needed
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Update the final key with the new value
          current[k] = value;
        } else {
          // Ensure the next level exists
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedFlight;
    });
  };


  console.log(flight)
  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title={"Flight Record"}
            action={
              <>
                <Tooltip title="Save flight record details"><IconButton size="small" onClick={() => console.log("save flight")}><SaveIcon /></IconButton></Tooltip>
                <Tooltip title="Delete flight"><IconButton size="small" onClick={() => console.log("delete flight")}><DeleteIcon /></IconButton></Tooltip>
              </>
            }
          />

          <Grid container spacing={1} >
            <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 3, xl: 3 }}
              id="date" label="Date" handleChange={handleChange}
              value={dayjs(flight?.date ?? dayjs().format('DD/MM/YYYY'), "DD/MM/YYYY")}
            />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 2 }}>
            <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
              id="departure.place"
              label={<Label icon={FlightTakeoffIcon} text="Place" />}
              handleChange={handleChange}
              value={flight.departure.place ?? ""}
              slotProps={PLACE_SLOT_PROPS}
              tooltip={"Departure place"}
            />
            <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
              id="departure.time"
              label={<Label icon={FlightTakeoffIcon} text="Time" />}
              handleChange={handleChange}
              value={flight.departure.time ?? ""}
              slotProps={TIME_SLOT_PROPS}
              tooltip={"Departure time"}
            />
            <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
              id="arrival.place"
              label={<Label icon={FlightLandIcon} text="Place" />}
              handleChange={handleChange}
              value={flight.arrival.place ?? ""}
              slotProps={PLACE_SLOT_PROPS}
              tooltip={"Arrival place"}
            />
            <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
              id="arrival.time"
              label={<Label icon={FlightLandIcon} text="Time" />}
              handleChange={handleChange}
              value={flight.arrival.time ?? ""}
              slotProps={TIME_SLOT_PROPS}
              tooltip={"Arrival time"}
            />
            <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
              id="landings.day"
              label="Day Landings"
              handleChange={handleChange}
              value={flight.landings.day === 0 ? "" : flight.landings.day ?? ""}
              tooltip={"Day landings"}
            />
            <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
              id="landings.night"
              label="Night Landings"
              handleChange={handleChange}
              value={flight.landings.night === 0 ? "" : flight.landings.night ?? ""}
              tooltip={"Night landings"}
            />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 2 }}>
            <AircraftType gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              handleChange={handleChange}
              value={flight.aircraft.model ?? ""}
            />

          </Grid>
        </CardContent>
      </Card >
    </>
  );
};

export default FlightRecordDetails;