import { useMemo } from "react";
import TextField from "./TextField";

const LANDING_SLOT_PROPS = { htmlInput: { inputMode: "numeric" } };

const getLandingValue = (val) => (val === 0 ? "" : val ?? "");

export const LandingField = ({ value, type, handleChange, fieldNameF }) => {

  const labels = useMemo(() => (
    {
      day: `${fieldNameF("land_day")} ${fieldNameF("landings")}`,
      night: `${fieldNameF("land_night")} ${fieldNameF("landings")}`,
    }
  ), [fieldNameF]);

  return (
    <TextField
      id={`landings.${type}`}
      label={labels[type]}
      handleChange={handleChange}
      value={getLandingValue(value)}
      slotProps={LANDING_SLOT_PROPS}
    />
  );
};

export default LandingField;