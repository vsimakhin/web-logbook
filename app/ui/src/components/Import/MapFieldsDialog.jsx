import { useState } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import AirplaneTicketOutlinedIcon from '@mui/icons-material/AirplaneTicketOutlined';
import DoubleArrowOutlinedIcon from '@mui/icons-material/DoubleArrowOutlined';
// Custom components
import Select from '../UIElements/Select';
import CardHeader from "../UIElements/CardHeader";

const fields = [
  { id: 'date', label: 'Date', default: 'Date' },
  { id: 'departure_place', label: 'Departure Place', default: 'Departure Place' },
  { id: 'departure_time', label: 'Departure Time', default: 'Departure Time' },
  { id: 'arrival_place', label: 'Arrival Place', default: 'Arrival Place' },
  { id: 'arrival_time', label: 'Arrival Time', default: 'Arrival Time' },
  { id: 'aircraft_model', label: 'Aircraft Model', default: 'Aircraft Model' },
  { id: 'aircraft_reg_name', label: 'Aircraft Reg Name', default: 'Aircraft Reg' },
  { id: 'se_time', label: 'SE Time', default: 'Time SE' },
  { id: 'me_time', label: 'ME Time', default: 'Time ME' },
  { id: 'mcc_time', label: 'MCC Time', default: 'Time MCC' },
  { id: 'total_time', label: 'Total Time', default: 'Time Total' },
  { id: 'night_time', label: 'Night Time', default: 'Time Night' },
  { id: 'ifr_time', label: 'IFR Time', default: 'Time IFR' },
  { id: 'pic_time', label: 'PIC Time', default: 'Time PIC' },
  { id: 'co_pilot_time', label: 'Co Pilot Time', default: 'Time CoPilot' },
  { id: 'dual_time', label: 'Dual Time', default: 'Time Dual' },
  { id: 'instructor_time', label: 'Instructor Time', default: 'Time Instructor' },
  { id: 'landings_day', label: 'Landings Day', default: 'Landings Day' },
  { id: 'landings_night', label: 'Landings Night', default: 'Landings Night' },
  { id: 'sim_type', label: 'Sim Type', default: 'SIM Type' },
  { id: 'sim_time', label: 'Sim Time', default: 'SIM Time' },
  { id: 'pic_name', label: 'PIC Name', default: 'PIC Name' },
  { id: 'remarks', label: 'Remarks', default: 'Remarks' },
];

const MapFieldsDialog = ({ open, onClose, payload }) => {
  const [result, setResult] = useState({});

  const handleChange = (key, value) => { setResult((prev) => ({ ...prev, [key]: value })) };

  const getHeader = (key) => { return payload.includes(key) ? key : "" };

  const loadLogbookProfile = () => {
    const newResult = {};

    for (const field of fields) {
      const header = getHeader(field.default);
      if (header) {
        newResult[field.id] = header;
      }
    }

    setResult(newResult);
  };

  return (
    <Dialog fullWidth open={open} onClose={() => onClose(null)}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Map Fields"
            action={
              <>
                <Tooltip title="Apply Web Logbook Standard Mapping">
                  <IconButton size="small" onClick={() => loadLogbookProfile()}><AirplaneTicketOutlinedIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Continue">
                  <IconButton size="small" onClick={() => onClose(result)}><DoubleArrowOutlinedIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton size="small" onClick={() => onClose()}><DisabledByDefaultOutlinedIcon /></IconButton>
                </Tooltip>
              </>
            }
          />
          <Grid container spacing={1}>
            {fields.map((field, index) => (
              <Select gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }} key={index}
                id={field.id}
                label={field.label}
                handleChange={handleChange}
                options={payload}
                value={result[field.id] ?? ""}
                disableClearable={false}
              />
            ))}
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  );
}

export default MapFieldsDialog;