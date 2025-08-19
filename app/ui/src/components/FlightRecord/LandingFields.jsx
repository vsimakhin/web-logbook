import { memo } from "react";
import TextField from "../UIElements/TextField";

const LANDING_SLOT_PROPS = {
  htmlInput: {
    inputMode: 'numeric',
  }
}

export const LandingFields = memo(({ flight, handleChange }) => {
  return (
    <>
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id="landings.day"
        label="Day Landings"
        handleChange={handleChange}
        value={flight.landings.day === 0 ? "" : flight.landings.day ?? ""}
        tooltip="Day landings"
        slotProps={LANDING_SLOT_PROPS}
      />
      <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
        id="landings.night"
        label="Night Landings"
        handleChange={handleChange}
        value={flight.landings.night === 0 ? "" : flight.landings.night ?? ""}
        tooltip="Night landings"
        slotProps={LANDING_SLOT_PROPS}
      />
    </>
  );
});

export default LandingFields;