import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "../UIElements/Select";
import { fetchAircraftModels } from "../../util/http/aircraft";

export const AircraftType = ({
  gsize,
  id = "aircraft.model",
  label = "Aircraft Type",
  value,
  handleChange,
  ...props
}) => {
  const navigate = useNavigate();

  const { data: options = [] } = useQuery({
    queryFn: ({ signal }) => fetchAircraftModels({ signal, navigate }),
    queryKey: ["aircraft-models"],
    staleTime: 3600000,
    gcTime: 3600000,
  });

  return (
    <Select
      gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      onBlur={(e) => handleChange(id, e.target.value)}
      value={value}
      tooltip={"Aircraft type"}
      options={options || []}
      freeSolo={true}
      {...props}
    />
  );
};

export default AircraftType;
