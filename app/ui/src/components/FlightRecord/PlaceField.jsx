import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { memo, useCallback } from 'react';
import dayjs from 'dayjs';
// MUI Icons
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
// Custom components
import Label from "../UIElements/Label"
import TextField from "../UIElements/TextField"
import { PLACE_SLOT_PROPS, TIME_SLOT_PROPS } from '../../constants/constants';
import { fetchDistance, fetchNightTime } from '../../util/http/logbook';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import { convertMinutesToTime } from '../../util/helpers';

const capitalizeFirstLetter = (str) => str ? `${str[0].toUpperCase()}${str.slice(1)}` : "";

const calculateTotalTime = (flight) => {
  // Parse times using the "HHMM" format
  const departure = dayjs(flight.departure.time, "HHmm");
  const arrival = dayjs(flight.arrival.time, "HHmm");

  // If arrival time is earlier than departure time, assume it's on the next day
  const adjustedArrival = arrival.isBefore(departure) ? arrival.add(1, "day") : arrival;

  // Calculate the total time in minutes
  const totalMinutes = adjustedArrival.diff(departure, "minute");

  // Format the total time as "HH:MM"
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export const PlaceField = memo(({ flight, handleChange, type, fieldNameF }) => {
  const icon = type === "departure" ? FlightTakeoffIcon : FlightLandIcon;
  const navigate = useNavigate();

  const { mutateAsync: calculateDistance } = useMutation({
    mutationFn: ({ departure, arrival }) => fetchDistance({ departure, arrival, navigate }),
  });

  const handlePlaceChange = useCallback(async () => {
    // quickly recalculate the distance to show on map
    const distance = await calculateDistance({ departure: flight.departure.place, arrival: flight.arrival.place });
    if (distance && flight.track === null) {
      handleChange("distance", distance);
    }
    // it's a trick to update the map when the place field is left
    // otherwise the map will be refreshed on each flight field change
    handleChange("redraw", Math.random());
  }, [flight, handleChange]);

  const { mutateAsync: getNightTime, isError, error } = useMutation({
    mutationFn: (signal) => fetchNightTime({ flight, navigate, signal }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to calculate night time' });

  const handleTimeChange = useCallback(async () => {
    // check length for the time field
    if (flight.departure.time.length === 4 && flight.arrival.time.length === 4) {
      const total_time = calculateTotalTime(flight);
      const old_total_time = flight.time.total_time;
      handleChange("time.total_time", total_time);

      // iterate over the flight.time fields and update them
      for (const key in flight.time) {
        if (key !== "total_time" && key !== "night_time" && old_total_time !== "" && flight.time[key] === old_total_time) {
          handleChange(`time.${key}`, total_time);
        }
      }

      // night time
      if (flight.time.night_time === "" && flight.date && flight.departure.place && flight.arrival.place) {
        const nightTimeData = await getNightTime();
        const nightTime = parseInt(nightTimeData.data) || 0;
        if (nightTime > 0) {
          handleChange("time.night_time", convertMinutesToTime(nightTime));
        }
      }
    }
  }, [flight, handleChange, getNightTime]);

  return (
    <>
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id={`${type}.place`}
        label={<Label icon={icon} text={fieldNameF(type == "departure" ? "dep_place" : "arr_place")} />}
        handleChange={handleChange}
        value={type == "departure" ? flight.departure.place : flight.arrival.place ?? ""}
        slotProps={PLACE_SLOT_PROPS}
        tooltip={`${capitalizeFirstLetter(type)} place`}
        onBlur={() => handlePlaceChange()}
      />
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id={`${type}.time`}
        label={<Label icon={icon} text={fieldNameF(type == "departure" ? "dep_time" : "arr_time")} />}
        handleChange={handleChange}
        value={type == "departure" ? flight.departure.time : flight.arrival.time ?? ""}
        slotProps={TIME_SLOT_PROPS}
        placeholder="HHMM"
        tooltip={`${capitalizeFirstLetter(type)} time`}
        onBlur={() => handleTimeChange()}
      />
    </>
  )
});

export default PlaceField;