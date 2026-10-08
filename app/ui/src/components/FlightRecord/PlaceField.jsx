import { useCallback, useRef } from 'react';
import dayjs from 'dayjs';

// MUI Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
// Custom components
import Label from "../UIElements/Label"
import TextField from "../UIElements/TextField"
import { PLACE_SLOT_PROPS, TIME_SLOT_PROPS } from '../../constants/constants';
import { useNightTime } from '../../hooks/queries';
import useCustomFields from '../../hooks/useCustomFields';

const capitalizeFirstLetter = (str) => str ? `${str[0].toUpperCase()}${str.slice(1)}` : "";

const calculateTotalTime = (flight) => {
  if (!flight) {
    return 0
  }

  const departure = dayjs(flight.departure.time, "HHmm");
  const arrival = dayjs(flight.arrival.time, "HHmm");

  // If arrival time is earlier than departure time, assume it's on the next day
  const adjustedArrival = arrival.isBefore(departure) ? arrival.add(1, "day") : arrival;

  return adjustedArrival.diff(departure, "minute");
}

export const PlaceField = ({
  flight,
  handleChange,
  type,
  fieldNameF,
  showPlace = true,
  showTime = true,
  disableGrid = false,
  disableLabel = false,
  slotProps: additionalSlotProps = {},
  ...props
}) => {
  const placeInitialValue = useRef("");
  const timeInitialValue = useRef("");

  const handlePlaceFocus = useCallback((event) => { placeInitialValue.current = event.target.value }, []);
  const handleTimeFocus = useCallback((event) => { timeInitialValue.current = event.target.value }, []);

  const isDeparture = type === "departure";
  const icon = isDeparture ? FlightTakeoffIcon : FlightLandIcon;

  const { calculateDistance } = useCustomFields();
  const calculateNightTime = useNightTime();

  const placeValue = isDeparture ? flight.departure?.place : flight.arrival?.place;
  const timeValue = isDeparture ? flight.departure?.time : flight.arrival?.time;

  const placeLabel = isDeparture ? fieldNameF("dep_place") : fieldNameF("arr_place");
  const timeLabel = isDeparture ? fieldNameF("dep_time") : fieldNameF("arr_time");

  const placeSlotProps = {
    ...PLACE_SLOT_PROPS,
    ...additionalSlotProps,
    input: { ...PLACE_SLOT_PROPS?.input, ...additionalSlotProps?.input },
  };

  const timeSlotProps = {
    ...TIME_SLOT_PROPS,
    ...additionalSlotProps,
    input: { ...TIME_SLOT_PROPS?.input, ...additionalSlotProps?.input },
  };

  const handlePlaceChange = useCallback(async (event) => {
    if (event.target.value === placeInitialValue.current) {
      return;
    }
    // quickly recalculate the distance to show on map
    const distance = await calculateDistance(flight);

    if (distance && flight.track === null) {
      handleChange("distance", distance);
    }
    // it's a trick to update the map when the place field is left
    // otherwise the map will be refreshed on each flight field change
    handleChange("redraw", Math.random());
  }, [flight, handleChange, calculateDistance]);

  const handleTimeChange = useCallback(async (event) => {
    if (event.target.value === timeInitialValue.current) {
      return;
    }

    // check length for the time field
    if (flight.departure?.time?.length !== 4 || flight.arrival?.time?.length !== 4) return;

    const total_time = calculateTotalTime(flight);
    const old_total_time = flight.time.total_time;
    handleChange("time.total_time", total_time);

    // iterate over the flight.time fields and update them
    for (const key in flight.time) {
      if (key !== "total_time" && key !== "night_time" && old_total_time !== 0 && flight.time[key] === old_total_time) {
        handleChange(`time.${key}`, total_time);
      }
    }

    // night time
    if (flight.date && flight.departure.place && flight.arrival.place) {
      const nightTimeData = await calculateNightTime(flight);
      const nightTime = parseInt(nightTimeData.data) || 0;
      handleChange("time.night_time", nightTime);
    }
  }, [flight, handleChange, calculateNightTime]);

  return (
    <>
      {showPlace && (
        <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
          id={`${type}.place`}
          label={disableLabel ? "" : <Label icon={icon} text={placeLabel} />}
          handleChange={handleChange}
          value={placeValue}
          slotProps={placeSlotProps}
          tooltip={`${capitalizeFirstLetter(type)} place`}
          onBlur={handlePlaceChange}
          disableGrid={disableGrid}
          onFocus={handlePlaceFocus}
          {...props}
        />
      )}
      {showTime && (
        <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
          id={`${type}.time`}
          label={disableLabel ? "" : <Label icon={icon} text={timeLabel} />}
          handleChange={handleChange}
          value={timeValue}
          slotProps={timeSlotProps}
          placeholder="HHMM"
          tooltip={`${capitalizeFirstLetter(type)} time`}
          onBlur={handleTimeChange}
          onFocus={handleTimeFocus}
          disableGrid={disableGrid}
          {...props}
        />
      )}
    </>
  )
};

export default PlaceField;