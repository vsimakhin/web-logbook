import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
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
import FlightTitle from "./FlightTitle";
import useSettings from '../../hooks/useSettings';
import FlightRecordMenuButtons from './FlightRecordMenuButtons';
import { FIELDS_VISIBILITY_KEY, tableJSONCodec } from '../../constants/constants';

export const FlightRecordDetails = ({ flight, handleChange, setFlight }) => {
  const title = useMemo(() => (<FlightTitle flight={flight} />), [flight]);
  const { fieldNameF } = useSettings();
  const [visibility, setVisibility] = useLocalStorageState(FIELDS_VISIBILITY_KEY, {}, { codec: tableJSONCodec });

  const timeFields = useMemo(() => (
    [
      { id: "time.total_time", label: fieldNameF("total") },
      { id: "time.se_time", label: fieldNameF("se") },
      { id: "time.me_time", label: fieldNameF("me") },
      { id: "time.mcc_time", label: fieldNameF("mcc") },
      { id: "time.night_time", label: fieldNameF("night") },
      { id: "time.ifr_time", label: fieldNameF("ifr") },
      { id: "time.pic_time", label: fieldNameF("pic") },
      { id: "time.co_pilot_time", label: fieldNameF("cop") },
      { id: "time.dual_time", label: fieldNameF("dual") },
      { id: "time.instructor_time", label: fieldNameF("instr") },
    ]
  ), [fieldNameF]);

  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title={title}
            action={<FlightRecordMenuButtons flight={flight} handleChange={handleChange} setFlight={setFlight} />}
          />
          <Grid container spacing={1} >
            <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 3, xl: 3 }}
              id="date"
              handleChange={handleChange}
              label={fieldNameF("date")}
              value={dayjs(flight?.date ?? dayjs().format('DD/MM/YYYY'), "DD/MM/YYYY")}
            />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <PlaceField flight={flight} handleChange={handleChange} type="departure" fieldNameF={fieldNameF} />
            <PlaceField flight={flight} handleChange={handleChange} type="arrival" fieldNameF={fieldNameF} />
            <LandingFields flight={flight} handleChange={handleChange} fieldNameF={fieldNameF} />
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
              label={fieldNameF("pic_name")}
              handleChange={handleChange}
              value={flight.pic_name ?? ""}
              onDoubleClick={() => handleChange("pic_name", "Self")}
            />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
            {timeFields.map((field) => (
              (visibility?.[field.id] ?? true) && <TimeField key={field.id} id={field.id} label={field.label} handleChange={handleChange} flight={flight} />
            ))}
          </Grid>

          {(visibility?.["simulator"] ?? true) &&
            <>
              <Divider sx={{ mt: 1 }} />
              <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
                <TextField gsize={{ xs: 5, sm: 4, md: 4, lg: 4, xl: 4 }}
                  id="sim.type"
                  label={`${fieldNameF("fstd")} ${fieldNameF("sim_type")}`}
                  handleChange={handleChange}
                  value={flight.sim.type ?? ""}
                />
                <TimeField id="sim.time" label={`${fieldNameF("fstd")} ${fieldNameF("sim_time")}`} handleChange={handleChange} flight={flight} />
              </Grid>
            </>
          }

          <Divider sx={{ mt: 1 }} />
          <Grid container spacing={1} sx={{ mt: 1 }} >
            <TextField gsize={"grow"}
              id="remarks"
              label={fieldNameF("remarks")}
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