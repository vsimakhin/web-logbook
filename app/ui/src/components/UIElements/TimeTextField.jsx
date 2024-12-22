import { useEffect, useState } from "react";
import { TextField } from "./TextField"
import { convertMinutesToTime, convertTimeToMinutes } from "../../util/helpers";

export const TimeTextField = ({ handleChange, value, ...props }) => {
  const [time, setTime] = useState(() => convertMinutesToTime(value)); // Initialize formatted time

  useEffect(() => {
    if (value) {
      setTime(convertMinutesToTime(value));
    }
  }, [value]);

  const handleTimeChange = (key, inputValue) => {
    let cleanedValue = inputValue.replace(/[^0-9]/g, ''); // Clean input
    if (cleanedValue.length > 2) {
      cleanedValue = cleanedValue.slice(0, -2) + ':' + cleanedValue.slice(-2);
    }
    setTime(cleanedValue); // Update state with cleaned value
  };

  const handleBlur = () => {
    // Validate full format (1-4 digits for hours + 2 digits for minutes)
    if (time.match(/^\d{1,4}:\d{2}$/)) {
      const minutes = convertTimeToMinutes(time);
      handleChange(props.id, minutes); // Trigger parent change
    } else {
      // If invalid format on blur, reset to the last valid `time` state
      setTime(convertMinutesToTime(value));
    }
  };

  return (
    <TextField
      {...props}
      handleChange={handleTimeChange}
      onBlur={handleBlur}
      value={time}
    />
  );
}