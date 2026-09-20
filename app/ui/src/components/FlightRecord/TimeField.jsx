import { useCallback, memo, useState, useEffect, useRef } from "react";
import TextField from "../UIElements/TextField";
import { FLIGHT_TIME_SLOT_PROPS, FLIGHT_TIME_SLOT_PROPS_FAA } from "../../constants/constants";
import { timeFieldFormat, parseTimeToMinutes } from "../../util/helpers";

export const TimeField = memo(({
  id,
  label,
  handleChange,
  total_time,
  value,
  tooltip = label,
  fieldFormat = 1,
  gsize = { xs: 5, sm: 2 }
}) => {
  // Local string representation for the text input
  const [text, setText] = useState(() => timeFieldFormat(value, fieldFormat));
  const isFocused = useRef(false);

  // Sync from props when value changes externally (e.g., initial load, record navigation)
  useEffect(() => {
    if (!isFocused.current) {
      setText(timeFieldFormat(value, fieldFormat));
    }
  }, [value, fieldFormat]);

  // Double click: copy total_time (which is in minutes)
  const handleDoubleClick = useCallback(() => {
    setText(timeFieldFormat(total_time, fieldFormat));
    handleChange(id, total_time || 0);
  }, [total_time, fieldFormat, handleChange, id]);

  // When user types in the input
  const handleInputChange = useCallback((_fieldId, newText) => {
    setText(newText);
    const minutes = parseTimeToMinutes(newText, fieldFormat);
    handleChange(id, minutes);
  }, [id, fieldFormat, handleChange]);

  // On blur, clean up and reformat to canonical string (e.g. "1.5" or "01:30")
  const handleBlur = useCallback(() => {
    isFocused.current = false;
    const minutes = parseTimeToMinutes(text, fieldFormat);
    setText(timeFieldFormat(minutes, fieldFormat));
    handleChange(id, minutes);
  }, [text, fieldFormat, id, handleChange]);

  const handleFocus = useCallback(() => { isFocused.current = true }, []);

  const placeholder = fieldFormat === 3 ? "0.0" : "H:MM";
  const slotProps = fieldFormat === 3 ? FLIGHT_TIME_SLOT_PROPS_FAA : FLIGHT_TIME_SLOT_PROPS;

  return (
    <TextField
      gsize={gsize}
      id={id}
      label={label}
      handleChange={handleInputChange}
      value={text}
      slotProps={slotProps}
      tooltip={tooltip}
      placeholder={placeholder}
      onDoubleClick={handleDoubleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});
TimeField.displayName = 'TimeField';

export default TimeField;