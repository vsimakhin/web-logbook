import { memo, useMemo } from "react";
import TextField from "../UIElements/TextField";

const LANDING_SLOT_PROPS = { htmlInput: { inputMode: "numeric" } };

const getLandingValue = (val) => (val === 0 ? "" : val ?? "");

export const LandingFields = memo(({ flight, handleChange, fieldNameF }) => {
  const labels = useMemo(() => (
    {
      day: `${fieldNameF("land_day")} ${fieldNameF("landings")}`,
      night: `${fieldNameF("land_night")} ${fieldNameF("landings")}`,
    }
  ), [fieldNameF]);

  return (
    <>
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id="landings.day"
        label={labels.day}
        handleChange={handleChange}
        value={getLandingValue(flight.landings.day)}
        slotProps={LANDING_SLOT_PROPS}
      />
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id="landings.night"
        label={labels.night}
        handleChange={handleChange}
        value={getLandingValue(flight.landings.night)}
        slotProps={LANDING_SLOT_PROPS}
      />
    </>
  );
});

export default LandingFields;