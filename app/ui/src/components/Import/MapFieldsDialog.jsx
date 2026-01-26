import { useCallback, useMemo, useState } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Divider from "@mui/material/Divider";
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import AirplaneTicketOutlinedIcon from '@mui/icons-material/AirplaneTicketOutlined';
import DoubleArrowOutlinedIcon from '@mui/icons-material/DoubleArrowOutlined';
import PetsIcon from '@mui/icons-material/Pets';
// Custom components
import Select from '../UIElements/Select';
import CardHeader from "../UIElements/CardHeader";
import TextField from "../UIElements/TextField";

const getHeader = (key, headers) => (headers.includes(key) ? key : "");

const fields = [
  { id: 'date', label: 'Date', default: 'Date', leon: 'flightDate' },
  { id: 'departure_place', label: 'Departure Place', default: 'Departure Place', leon: 'from' },
  { id: 'departure_time', label: 'Departure Time', default: 'Departure Time', leon: 'actualDepartureTime' },
  { id: 'arrival_place', label: 'Arrival Place', default: 'Arrival Place', leon: 'to' },
  { id: 'arrival_time', label: 'Arrival Time', default: 'Arrival Time', leon: 'actualArrivalTime' },
  { id: 'aircraft_model', label: 'Aircraft Model', default: 'Aircraft Model', leon: 'selectedAircraftType' },
  { id: 'aircraft_reg_name', label: 'Aircraft Reg Name', default: 'Aircraft Reg', leon: 'selectedAircraftID' },
  { id: 'se_time', label: 'SE Time', default: 'Time SE' },
  { id: 'me_time', label: 'ME Time', default: 'Time ME' },
  { id: 'mcc_time', label: 'MCC Time', default: 'Time MCC', leon: 'multiPilot' },
  { id: 'total_time', label: 'Total Time', default: 'Time Total', leon: 'totalTime' },
  { id: 'night_time', label: 'Night Time', default: 'Time Night', leon: 'night' },
  { id: 'ifr_time', label: 'IFR Time', default: 'Time IFR', leon: 'ifr' },
  { id: 'pic_time', label: 'PIC Time', default: 'Time PIC', leon: 'pic' },
  { id: 'co_pilot_time', label: 'Co Pilot Time', default: 'Time CoPilot', leon: 'sic' },
  { id: 'dual_time', label: 'Dual Time', default: 'Time Dual', leon: 'dualReceived' },
  { id: 'instructor_time', label: 'Instructor Time', default: 'Time Instructor', leon: 'dualGiven' },
  { id: 'landings_day', label: 'Landings Day', default: 'Landings Day', leon: 'dayLandings' },
  { id: 'landings_night', label: 'Landings Night', default: 'Landings Night', leon: 'nightLandings' },
  { id: 'sim_type', label: 'Sim Type', default: 'SIM Type' },
  { id: 'sim_time', label: 'Sim Time', default: 'SIM Time' },
  { id: 'pic_name', label: 'PIC Name', default: 'PIC Name', leon: 'selectedCrewCommander' },
  { id: 'remarks', label: 'Remarks', default: 'Remarks' },
];

const generateProfile = (headers, fieldKey = "default") => {
  const profile = {};
  for (const field of fields) {
    const key = field[fieldKey];
    const header = getHeader(key, headers);
    if (header) profile[field.id] = header;
  }
  return profile;
};

const ProfileButton = ({ tooltip, icon: Icon, fieldKey, setProfile, headers }) => {
  const handleClick = useCallback(() => {
    setProfile(generateProfile(headers, fieldKey));
  }, [headers, setProfile, fieldKey]);

  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={handleClick}><Icon /></IconButton>
    </Tooltip>
  );
}

const MapFieldsDialog = ({ open, onClose, payload: headers }) => {
  const [profile, setProfile] = useState({});
  const handleChange = useCallback((key, value) => { setProfile((prev) => ({ ...prev, [key]: value })) }, [setProfile]);

  const actionButtons = useMemo(() => (
    <Box display="flex" alignItems="center" gap={0}>
      <ProfileButton tooltip="Apply Leon Mapping"
        fieldKey="leon"
        icon={PetsIcon}
        setProfile={setProfile} headers={headers}
      />
      <ProfileButton tooltip="Apply Web Logbook Mapping"
        fieldKey="default"
        icon={AirplaneTicketOutlinedIcon}
        setProfile={setProfile} headers={headers}
      />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Continue">
        <span>
          <IconButton size="small" onClick={() => onClose(profile)} disabled={Object.keys(profile).length === 0}>
            <DoubleArrowOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Close">
        <IconButton size="small" onClick={onClose}>
          <DisabledByDefaultOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Box>
  ), [onClose, profile, setProfile, headers]);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose(null)}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Map Fields" action={actionButtons} />
          <Grid container spacing={1}>
            {fields.map((field) => (
              <Select gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
                key={field.id}
                id={field.id}
                label={field.label}
                handleChange={handleChange}
                options={headers}
                value={profile[field.id] ?? ""}
                disableClearable={false}
              />
            ))}
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="pic_self_replace"
              label="Name to Detect as Self"
              tooltip="Used to detect your name in imported data and replace it with “Self”. Enter it exactly as it appears in the export"
              handleChange={handleChange}
              value={profile["pic_self_replace"] ?? ""}
            />
          </Grid>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default MapFieldsDialog;