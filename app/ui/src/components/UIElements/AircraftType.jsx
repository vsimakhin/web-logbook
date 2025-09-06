import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
// Custom components
import Select from "../UIElements/Select";
import { fetchAircraftModels } from "../../util/http/aircraft";
import useSettings from "../../hooks/useSettings";

export const AircraftType = ({
  gsize,
  id = "aircraft.model",
  label,
  value,
  handleChange,
  ...props
}) => {
  const navigate = useNavigate();
  const { fieldName } = useSettings();

  const { data: options = [] } = useQuery({
    queryFn: ({ signal }) => fetchAircraftModels({ signal, navigate }),
    queryKey: ["aircraft-models"],
    staleTime: 3600000,
    gcTime: 3600000,
  });

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
