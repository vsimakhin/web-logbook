import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Grid from "@mui/material/Grid";
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
import { getValue } from '../../util/helpers';
import FlightTags from '../UIElements/FlightTags';
import { fetchAircraftModelsCategories } from '../../util/http/aircraft';

export const FlightRecordDetails = ({ flight, handleChange, setFlight }) => {
  const title = useMemo(() =>
    <FlightTitle prev_uuid={flight.prev_uuid} next_uuid={flight.next_uuid} />,
    [flight.prev_uuid, flight.next_uuid]
  );
  const { fieldNameF, settings } = useSettings();
  const [visibility] = useLocalStorageState(FIELDS_VISIBILITY_KEY, {}, { codec: tableJSONCodec });

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

  const { data: models = [] } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
    select: (data) => data || [], // Ensure options is always an array
  });

  const handlePicNameDoubleClick = useCallback(() => {
    setFlight((prev) => ({ ...prev, pic_name: settings.self_pic_label || "Self" }));
  }, [setFlight, settings.self_pic_label]);

  // Auto fill pic time
  useEffect(() => {
    if (flight.uuid === "new" && flight.pic_name === (settings.self_pic_label || "Self") && !flight.time.pic_time && flight.time.total_time) {
      setFlight((prev) => ({ ...prev, time: { ...prev.time, pic_time: prev.time.total_time } }));
    }
  }, [flight.uuid, flight.pic_name, flight.time.pic_time, flight.time.total_time, setFlight, settings.self_pic_label])

  // Auto fill time fields
  useEffect(() => {
    const timeUpdates = {};

    if (flight.uuid === "new" && flight.aircraft.model && models.length > 0) {
      const modelData = models.find(m => m.model === flight.aircraft.model);
      if (modelData && modelData.time_fields_auto_fill) {
        Object.entries(modelData.time_fields_auto_fill).forEach(([key, autoFill]) => {
          if (autoFill && !flight.time[key]) {
            timeUpdates[key] = flight.time.total_time;
          }
        });
      }

      if (Object.keys(timeUpdates).length > 0) {
        setFlight(prev => ({ ...prev, time: { ...prev.time, ...timeUpdates } }));
      }
    }
  }, [flight.aircraft.model, flight.uuid, models, setFlight])

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
            <LandingFields day={flight.landings.day} night={flight.landings.night} handleChange={handleChange} fieldNameF={fieldNameF} />
          </Grid>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            <AircraftType gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              handleChange={handleChange}
              value={flight.aircraft.model ?? ""}
            />
            <AircraftReg gsize={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}
              handleChange={handleChange}
              value={flight.aircraft.reg_name}
              aircraft_model={flight.aircraft.model}
            />
            <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
              id="pic_name"
              label={fieldNameF("pic_name")}
              handleChange={handleChange}
              value={flight.pic_name ?? ""}
              onDoubleClick={handlePicNameDoubleClick}
            />
          </Grid>

          <Divider sx={{ mt: 1 }} />

          <Grid container spacing={1} sx={{ mt: 1 }} columns={10}>
            {timeFields.map((field) => (
              (visibility?.[field.id] ?? true) &&
              <TimeField
                key={field.id} id={field.id} label={field.label}
                handleChange={handleChange}
                total_time={flight.time.total_time}
                value={getValue(flight, field.id)} />
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
                <TimeField
                  id="sim.time" label={`${fieldNameF("fstd")} ${fieldNameF("sim_time")}`}
                  handleChange={handleChange}
                  total_time={flight.time.total_time}
                  value={getValue(flight, "sim.time")} />
              </Grid>
            </>
          }

          {((visibility?.["remarks"] ?? true) || (visibility?.["tags"] ?? true)) &&
            <Divider sx={{ mt: 1 }} />
          }
          <Grid container spacing={1} sx={{ mt: 1 }} >
            {(visibility?.["remarks"] ?? true) &&
              <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
                id="remarks"
                label={fieldNameF("remarks")}
                handleChange={handleChange}
                value={flight.remarks ?? ""}
              />
            }
            {(visibility?.["tags"] ?? true) &&
              <FlightTags gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
                id="tags"
                label={fieldNameF("tags")}
                tooltip="Flight tags. To add a tag, start typing and press Enter."
                handleChange={handleChange}
                value={flight.tags ? flight.tags.split(',') : []}
              />
            }
          </Grid>
        </CardContent>
      </Card >
    </>
  );
};

export default FlightRecordDetails;