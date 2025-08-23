import { memo, useMemo } from "react";
import TextField from "../UIElements/TextField";

const LANDING_SLOT_PROPS = {
  htmlInput: {
    inputMode: "numeric",
  },
};

const fields = [
  { key: "day", labelKey: "land_day" },
  { key: "night", labelKey: "land_night" },
];

function getLandingValue(val) {
  return val === 0 ? "" : val ?? "";
}

export const LandingFields = memo(({ flight, handleChange, getStandardFieldName }) => {
  const labels = useMemo(() => (
    fields.map(f => `${getStandardFieldName("landings")} ${getStandardFieldName(f.labelKey)}`)
  ), [getStandardFieldName]);

  return (
    <>
      {fields.map((f, idx) => (
        <TextField
          key={f.key}
          gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
          id={`landings.${f.key}`}
          label={labels[idx]}
          handleChange={handleChange}
          value={getLandingValue(flight.landings[f.key])}
          slotProps={LANDING_SLOT_PROPS}
        />
      ))}
    </>
  );
});

export default LandingFields;