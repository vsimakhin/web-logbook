import TextField from "../UIElements/TextField";
import { getValue } from "../../util/helpers";
import { FLIGHT_TIME_SLOT_PROPS } from "../../constants/constants";
import { useCallback } from "react";

export const TimeField = ({ id, label, handleChange, flight, tooltip = label, gsize = { xs: 5, sm: 2, md: 2, lg: 2, xl: 2 } }) => {
  const handleDoubeClick = useCallback(() => {
    handleChange(id, flight.time.total_time);
  }, [flight.time.total_time, handleChange, id]);

  return (
    <TextField gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={getValue(flight, id) ?? ""}
      slotProps={FLIGHT_TIME_SLOT_PROPS}
      tooltip={tooltip}
      placeholder="HH:MM"
      onDoubleClick={handleDoubeClick}
    />
  );
}
export default TimeField;