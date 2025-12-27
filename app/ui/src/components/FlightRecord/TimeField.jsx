import { useCallback, memo } from "react";
import TextField from "../UIElements/TextField";
import { FLIGHT_TIME_SLOT_PROPS } from "../../constants/constants";

export const TimeField = memo(({ id, label, handleChange, total_time, value, tooltip = label, gsize = { xs: 5, sm: 2, md: 2, lg: 2, xl: 2 } }) => {
  const handleDoubeClick = useCallback(() => {
    handleChange(id, total_time);
  }, [total_time, handleChange, id]);

  return (
    <TextField gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value ?? ""}
      slotProps={FLIGHT_TIME_SLOT_PROPS}
      tooltip={tooltip}
      placeholder="HH:MM"
      onDoubleClick={handleDoubeClick}
    />
  );
});
TimeField.displayName = 'TimeField';

export default TimeField;