import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
// Custom components
import Select from "./Select";
import { fetchTags } from "../../util/http/logbook";

export const FlightTags = ({ gsize, id = "tags", label = "Tags", value, handleChange, ...props }) => {
  const navigate = useNavigate();

  const { data: options = [] } = useQuery({
    queryKey: ['logbook', 'tags'],
    queryFn: ({ signal }) => fetchTags({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    select: (data) => data || [], // Ensure options is always an array
  });

  return (
    <Select gsize={gsize}
      id={id}
      label={label}
      handleChange={handleChange}
      value={value}
      tooltip={"Flight tags"}
      options={options}
      freeSolo={true}
      multiple
      {...props}
    />
  );
};

export default FlightTags;