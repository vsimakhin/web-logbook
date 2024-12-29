import { useState } from 'react';
import dayjs from 'dayjs';
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
import Divider from '@mui/material/Divider';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import HelpCenterOutlinedIcon from '@mui/icons-material/HelpCenterOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// Custom
import CardHeader from "../UIElements/CardHeader";
import DatePicker from '../UIElements/DatePicker';
import TextField from '../UIElements/TextField';
import AircraftType from './AircraftType';
import AircraftReg from './AircraftReg';
import TimeField from './TimeField';
import PlaceField from './PlaceField';
import HelpDrawer from './HelpDrawer';
import LandingFields from './LandingFields';

export const FlightRecordDetails = ({ flight, handleChange }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title={"Flight Record"}
            action={
              <>
                <Tooltip title="Help"><IconButton size="small" onClick={() => setIsHelpOpen(true)}><HelpCenterOutlinedIcon /></IconButton></Tooltip>
                <Tooltip title="New flight record"><IconButton size="small" onClick={() => console.log("new flight")}><AddBoxOutlinedIcon /></IconButton></Tooltip>
                <Tooltip title="Copy flight record"><IconButton size="small" onClick={() => console.log("copy flight")}><ContentCopyOutlinedIcon /></IconButton></Tooltip>
                <Tooltip title="Save flight record"><IconButton size="small" onClick={() => console.log("save flight")}><SaveOutlinedIcon /></IconButton></Tooltip>
                <Tooltip title="Delete flight"><IconButton size="small" onClick={() => console.log("delete flight")}><DeleteOutlinedIcon /></IconButton></Tooltip>
              </>
            }
          />

          <Grid container spacing={1} >
            <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 3, xl: 3 }}
              id="date" label="Date" handleChange={handleChange}
              value={dayjs(flight?.date ?? dayjs().format('DD/MM/YYYY'), "DD/MM/YYYY")}
            />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <PlaceField flight={flight} handleChange={handleChange} type="departure" />
            <PlaceField flight={flight} handleChange={handleChange} type="arrival" />
            <LandingFields flight={flight} handleChange={handleChange} />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 2 }}>
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
              label="PIC Name"
              handleChange={handleChange}
              value={flight.pic_name ?? ""}
              tooltip="Pilot in Command Name"
              onDoubleClick={() => handleChange("pic_name", "Self")}
            />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
            <TimeField id="time.total_time" label="Total Time" handleChange={handleChange} flight={flight} tooltip="Total Time" />
            <TimeField id="time.se_time" label="Single Engine" handleChange={handleChange} flight={flight} tooltip="Single Engine Time" />
            <TimeField id="time.me_time" label="Multi Engine" handleChange={handleChange} flight={flight} tooltip="Multi Engine Time" />
            <TimeField id="time.mcc_time" label="MCC" handleChange={handleChange} flight={flight} tooltip="MCC Time" />
            <TimeField id="time.night_time" label="Night" handleChange={handleChange} flight={flight} tooltip="Night Time" />
            <TimeField id="time.ifr_time" label="IFR" handleChange={handleChange} flight={flight} tooltip="IFR Time" />
            <TimeField id="time.pic_time" label="PIC" handleChange={handleChange} flight={flight} tooltip="PIC Time" />
            <TimeField id="time.co_pilot_time" label="Co Pilot" handleChange={handleChange} flight={flight} tooltip="SIC/CoPilot Time" />
            <TimeField id="time.dual_time" label="Dual" handleChange={handleChange} flight={flight} tooltip="Dual Time" />
            <TimeField id="time.instructor_time" label="Instructor" handleChange={handleChange} flight={flight} tooltip="Instructor Time" />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
            <TextField gsize={{ xs: 5, sm: 4, md: 4, lg: 4, xl: 4 }}
              id="sim.type"
              label="Simulator Type"
              handleChange={handleChange}
              value={flight.sim.type ?? ""}
              tooltip="Simulator Type"
            />
            <TimeField id="sim.time" label="Sim Time" handleChange={handleChange} flight={flight} tooltip="Simulator Time" />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} >
            <TextField gsize={"grow"}
              id="remarks"
              label="Remarks"
              handleChange={handleChange}
              value={flight.remarks ?? ""}
              tooltip="Remarks"
            />
          </Grid>
        </CardContent>
      </Card >
      <HelpDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default FlightRecordDetails;