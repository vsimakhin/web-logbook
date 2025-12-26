import { useMemo } from "react";
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import TextField from "../UIElements/TextField";
import { FIELDS_VISIBILITY_KEY, tableJSONCodec } from "../../constants/constants";

const LANDING_SLOT_PROPS = { htmlInput: { inputMode: "numeric" } };

const getLandingValue = (val) => (val === 0 ? "" : val ?? "");

export const LandingFields = ({ day, night, handleChange, fieldNameF }) => {
  const [visibility] = useLocalStorageState(FIELDS_VISIBILITY_KEY, {}, { codec: tableJSONCodec });

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
        value={getLandingValue(day)}
        slotProps={LANDING_SLOT_PROPS}
      />
      {(visibility?.["landings.night"] ?? true) &&
        <TextField gsize={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}
          id="landings.night"
          label={labels.night}
          handleChange={handleChange}
          value={getLandingValue(night)}
          slotProps={LANDING_SLOT_PROPS}
        />
      }
    </>
  );
};

export default LandingFields;