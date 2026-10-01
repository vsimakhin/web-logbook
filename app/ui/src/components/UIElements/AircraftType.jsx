import { useMemo } from "react";
// Custom components
import Select from "../UIElements/Select";
import useSettings from "../../hooks/useSettings";
import { useLogbookQuery } from "../../hooks/queries";

const getUniqueAircraftTypes = (flights = []) => [
  ...new Set(
    flights
      .map((flight) => flight.aircraft.model?.trim())
      .filter(Boolean)
  ),
].sort();

export const AircraftType = ({ gsize, id = "aircraft.model", label, value, handleChange, ...props }) => {
  const { fieldName } = useSettings();

  const { data } = useLogbookQuery();
  const options = useMemo(() => getUniqueAircraftTypes(data), [data]);
  const fieldLabel = useMemo(() =>
    label ? label : `${fieldName("aircraft", "flightRecord")} ${fieldName("model", "flightRecord")}`, [label, fieldName]
  );

  return (
    <Select
      gsize={gsize}
      id={id}
      label={fieldLabel}
      handleChange={handleChange}
      onBlur={(e) => handleChange(id, e.target.value)}
      value={value}
      tooltip={fieldLabel}
      options={options || []}
      freeSolo={true}
      {...props}
    />
  );
};

export default AircraftType;
