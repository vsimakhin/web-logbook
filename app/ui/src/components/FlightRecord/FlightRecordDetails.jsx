import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import DatePicker from '../UIElements/DatePicker';
import TextField from '../UIElements/TextField';
import AircraftType from '../UIElements/AircraftType';
import AircraftReg from '../UIElements/AircraftReg';
import TimeField from '../UIElements/TimeField';
import PlaceField from './PlaceField';
import FlightTitle from "./FlightTitle";
import useSettings from '../../hooks/useSettings';
import FlightRecordMenuButtons from './FlightRecordMenuButtons';
import { PLACE_SLOT_PROPS, TIME_SLOT_PROPS } from '../../constants/constants';
import { getValue } from '../../util/helpers';
import FlightTags from '../UIElements/FlightTags';
import { PICNameField } from './PICNameField';
import { useModelsCategoriesQuery } from '../../hooks/queries';
import FlightRecordLayout from './FlightRecordLayout';
import LandingField from '../UIElements/LandingField';
import useCustomFields from '../../hooks/useCustomFields';

const getFieldProps = (fieldType) => {
  const props = { slotProps: undefined, type: undefined, placeholder: undefined };

  switch (fieldType) {
    case 'time':
      props.slotProps = TIME_SLOT_PROPS;
      props.placeholder = 'HHMM';
      break;
    case 'number':
      props.type = 'number';
      break;
    case 'enroute':
      props.slotProps = PLACE_SLOT_PROPS;
      break;
  }

  return props;
};

const timeFields = [
  "time.total_time",
  "time.se_time",
  "time.me_time",
  "time.mcc_time",
  "time.night_time",
  "time.ifr_time",
  "time.pic_time",
  "time.co_pilot_time",
  "time.dual_time",
  "time.instructor_time"
];

export const FlightRecordDetails = ({ flight, handleChange, setFlight }) => {
  const [editingLayout, setEditingLayout] = useState(false);
  const title = useMemo(() =>
    <FlightTitle prev_uuid={flight.prev_uuid} next_uuid={flight.next_uuid} />,
    [flight.prev_uuid, flight.next_uuid]
  );

  const { customFields, calculateDistance } = useCustomFields();
  const enrouteFieldChange = useCallback(async () => {
    const distance = await calculateDistance(flight);
    handleChange("distance", distance);
    handleChange("redraw", Math.random());
  }, [handleChange, calculateDistance, flight]);

  const { fieldNameF, settings, timeFieldsFormat } = useSettings();
  const labels = useMemo(() => (
    {
      date: fieldNameF("total"),
      "time.total_time": fieldNameF("total"),
      "time.se_time": fieldNameF("se"),
      "time.me_time": fieldNameF("me"),
      "time.mcc_time": fieldNameF("mcc"),
      "time.night_time": fieldNameF("night"),
      "time.ifr_time": fieldNameF("ifr"),
      "time.pic_time": fieldNameF("pic"),
      "time.co_pilot_time": fieldNameF("cop"),
      "time.dual_time": fieldNameF("dual"),
      "time.instructor_time": fieldNameF("instr"),
      "sim.type": `${fieldNameF("fstd")} ${fieldNameF("sim_type")}`,
      "sim.time": `${fieldNameF("fstd")} ${fieldNameF("sim_time")}`,
      tags: fieldNameF("tags"),
      remarks: fieldNameF("remarks"),
      "landings.day": `${fieldNameF("land_day")} ${fieldNameF("landings")}`,
      "landings.night": `${fieldNameF("land_night")} ${fieldNameF("landings")}`,
    }
  ), [fieldNameF]);

  const { data: models } = useModelsCategoriesQuery();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight.aircraft.model, flight.uuid, flight.time.total_time, models, setFlight])

  return (
    <>
      <Card variant="outlined" sx={{ mb: 1 }}>
        <CardContent>
          <CardHeader title={title}
            action={
              <FlightRecordMenuButtons flight={flight} handleChange={handleChange} editingLayout={editingLayout} setEditingLayout={setEditingLayout} />
            } />

          <FlightRecordLayout editing={editingLayout}>
            <div key="date">
              <DatePicker id="date" handleChange={handleChange} label={labels.date} value={flight?.date ? dayjs(flight.date) : dayjs()} />
            </div>
            <div key="departure.place" >
              <PlaceField flight={flight} handleChange={handleChange} type="departure" fieldNameF={fieldNameF} showTime={false} disableGrid />
            </div>
            <div key="departure.time">
              <PlaceField flight={flight} handleChange={handleChange} type="departure" fieldNameF={fieldNameF} showPlace={false} disableGrid />
            </div>
            <div key="arrival.place">
              <PlaceField flight={flight} handleChange={handleChange} type="arrival" fieldNameF={fieldNameF} showTime={false} disableGrid />
            </div>
            <div key="arrival.time">
              <PlaceField flight={flight} handleChange={handleChange} type="arrival" fieldNameF={fieldNameF} showPlace={false} disableGrid />
            </div>
            <div key="landings.day">
              <LandingField value={flight.landings.day} handleChange={handleChange} type="day" label={labels["landings.day"]} />
            </div>
            <div key="landings.night">
              <LandingField value={flight.landings.night} handleChange={handleChange} type="night" label={labels["landings.night"]} />
            </div>
            <div key="aircraft.model">
              <AircraftType handleChange={handleChange} value={flight.aircraft.model ?? ""} />
            </div>
            <div key="aircraft.reg_name">
              <AircraftReg handleChange={handleChange} value={flight.aircraft.reg_name} aircraft_model={flight.aircraft.model} />
            </div>
            <div key="pic_name">
              <PICNameField handleChange={handleChange} value={flight.pic_name ?? ""} />
            </div>
            {timeFields.map((field) => (
              <div key={field}>
                <TimeField
                  id={field} label={labels[field]}
                  handleChange={handleChange}
                  total_time={flight.time.total_time}
                  fieldFormat={timeFieldsFormat}
                  value={getValue(flight, field)} />
              </div>
            ))}
            <div key="sim.type">
              <TextField id="sim.type" label={labels["sim.type"]} handleChange={handleChange} value={flight.sim.type ?? ""} />
            </div>
            <div key="sim.time">
              <TimeField gsize={null} id="sim.time" label={labels["sim.time"]} handleChange={handleChange} total_time={flight.time.total_time} value={getValue(flight, "sim.time")} />
            </div>
            <div key="tags">
              <FlightTags id="tags" label={labels.tags}
                tooltip="Flight tags. To add a tag, start typing and press Enter."
                handleChange={handleChange}
                value={flight.tags ? flight.tags.split(',') : []}
              />
            </div>
            <div key="remarks">
              <TextField
                id="remarks"
                label={labels.remarks}
                handleChange={handleChange}
                value={flight.remarks ?? ""}
                multiline
              />
            </div>

            {customFields.map((field) => {
              const props = getFieldProps(field.type);

              if (field.type === 'duration') {
                return (
                  <div key={field.uuid}>
                    <TimeField
                      id={`custom_fields.${field.uuid}`}
                      label={field.name}
                      tooltip={field.description}
                      value={flight.custom_fields?.[field.uuid] || 0}
                      handleChange={handleChange}
                      fieldFormat={timeFieldsFormat}
                    />
                  </div>
                );
              }

              return (
                <div key={field.uuid}>
                  <TextField key={field.uuid}
                    label={field.name}
                    id={`custom_fields.${field.uuid}`}
                    tooltip={field.description}
                    value={flight.custom_fields?.[field.uuid] || ''}
                    handleChange={handleChange}
                    slotProps={props.slotProps}
                    placeholder={props.placeholder}
                    type={props.type}
                    onBlur={field.type === 'enroute' ? enrouteFieldChange : undefined}
                  />
                </div>
              );
            })}
          </FlightRecordLayout>
        </CardContent>
      </Card >
    </>
  );
};

export default FlightRecordDetails;