import TextField from "./TextField";

const LANDING_SLOT_PROPS = { htmlInput: { inputMode: "numeric" } };

const getLandingValue = (val) => (val === 0 ? "" : val ?? "");

export const LandingField = ({ value, type, label, handleChange }) => {
  return (
    <TextField
      id={`landings.${type}`}
      label={label}
      handleChange={handleChange}
      value={getLandingValue(value)}
      slotProps={LANDING_SLOT_PROPS}
    />
  );
};

export default LandingField;