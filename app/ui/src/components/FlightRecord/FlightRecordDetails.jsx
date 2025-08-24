import dayjs from 'dayjs';
import { memo, useMemo } from 'react';
// MUI UI elements
import Grid from "@mui/material/Grid2";
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import DatePicker from '../UIElements/DatePicker';
import TextField from '../UIElements/TextField';
import AircraftType from '../UIElements/AircraftType';
import AircraftReg from '../UIElements/AircraftReg';
import TimeField from './TimeField';
import PlaceField from './PlaceField';
import LandingFields from './LandingFields';
import HelpButton from "./HelpButton";
import NewFlightRecordButton from "./NewFlightRecordButton";
import CopyFlightRecordButton from "./CopyFlightRecordButton";
import SaveFlightRecordButton from "./SaveFlightRecordButton";
import DeleteFlightRecordButton from "./DeleteFlightRecordButton";
import ResetTrackButton from "./ResetTrackButton";
import FlightTitle from "./FlightTitle";
import useSettings from '../../hooks/useSettings';

const ActionButtons = memo(({ flight, handleChange, setFlight }) => (
  <>
    <HelpButton />
    <SaveFlightRecordButton flight={flight} handleChange={handleChange} />
    {flight.uuid !== "new" && <NewFlightRecordButton setFlight={setFlight} />}
    {flight.uuid !== "new" && <CopyFlightRecordButton setFlight={setFlight} />}
    {flight.track && <ResetTrackButton flight={flight} handleChange={handleChange} />}
    {flight.uuid !== "new" && <DeleteFlightRecordButton flight={flight} />}
  </>
));

export const FlightRecordDetails = ({ flight, handleChange, setFlight }) => {
  const title = useMemo(() => (<FlightTitle flight={flight} />), [flight]);
  const { fieldName } = useSettings();

  const fieldLabels = useMemo(() => ({
    date: fieldName("date", "flightRecord"),
    pic_name: fieldName("pic_name", "flightRecord"),
    total: fieldName("total", "flightRecord"),
    se: fieldName("se", "flightRecord"),
    me: fieldName("me", "flightRecord"),
    mcc: fieldName("mcc", "flightRecord"),
    night: fieldName("night", "flightRecord"),
    ifr: fieldName("ifr", "flightRecord"),
    pic: fieldName("pic", "flightRecord"),
    cop: fieldName("cop", "flightRecord"),
    dual: fieldName("dual", "flightRecord"),
    instr: fieldName("instr", "flightRecord"),
    sim_type: `${fieldName("fstd", "flightRecord")} ${fieldName("sim_type", "flightRecord")}`,
    sim_time: `${fieldName("fstd", "flightRecord")} ${fieldName("sim_time", "flightRecord")}`,
    remarks: fieldName("remarks", "flightRecord"),
  }), [fieldName]);

  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title={title}
            action={<ActionButtons flight={flight} handleChange={handleChange} setFlight={setFlight} />}
          />
          <Grid container spacing={1} >
            <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 3, xl: 3 }}
              id="date"
              handleChange={handleChange}
              label={fieldLabels.date}
              value={dayjs(flight?.date ?? dayjs().format('DD/MM/YYYY'), "DD/MM/YYYY")}
            />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <PlaceField flight={flight} handleChange={handleChange} type="departure" fieldName={fieldName} />
            <PlaceField flight={flight} handleChange={handleChange} type="arrival" fieldName={fieldName} />
            <LandingFields flight={flight} handleChange={handleChange} fieldName={fieldName} />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <AircraftType gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              handleChange={handleChange}
              value={flight.aircraft.model ?? ""}
            />
            <AircraftReg gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              handleChange={handleChange}
              value={flight.aircraft.reg_name}
            />
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="pic_name"
              label={fieldLabels.pic_name}
              handleChange={handleChange}
              value={flight.pic_name ?? ""}
              onDoubleClick={() => handleChange("pic_name", "Self")}
            />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
            <TimeField id="time.total_time" label={fieldLabels.total} handleChange={handleChange} flight={flight} />
            <TimeField id="time.se_time" label={fieldLabels.se} handleChange={handleChange} flight={flight} />
            <TimeField id="time.me_time" label={fieldLabels.me} handleChange={handleChange} flight={flight} />
            <TimeField id="time.mcc_time" label={fieldLabels.mcc} handleChange={handleChange} flight={flight} />
            <TimeField id="time.night_time" label={fieldLabels.night} handleChange={handleChange} flight={flight} />
            <TimeField id="time.ifr_time" label={fieldLabels.ifr} handleChange={handleChange} flight={flight} />
            <TimeField id="time.pic_time" label={fieldLabels.pic} handleChange={handleChange} flight={flight} />
            <TimeField id="time.co_pilot_time" label={fieldLabels.cop} handleChange={handleChange} flight={flight} />
            <TimeField id="time.dual_time" label={fieldLabels.dual} handleChange={handleChange} flight={flight} />
            <TimeField id="time.instructor_time" label={fieldLabels.instr} handleChange={handleChange} flight={flight} />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
            <TextField gsize={{ xs: 5, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="sim.type"
              label={fieldLabels.sim_type}
              handleChange={handleChange}
              value={flight.sim.type ?? ""}
            />
            <TimeField id="sim.time" label={fieldLabels.sim_time} handleChange={handleChange} flight={flight} />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} >
            <TextField gsize={"grow"}
              id="remarks"
              label={fieldLabels.remarks}
              handleChange={handleChange}
              value={flight.remarks ?? ""}
            />
          </Grid>
        </CardContent>
      </Card >
    </>
  );
};

export default FlightRecordDetails;