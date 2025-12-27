import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "./Select";
import { fetchTags } from "../../util/http/logbook";

export const FlightTags = ({ gsize, id = "tags", label = "Tags", value, handleChange, ...props }) => {

  const { data: options = [] } = useQuery({
    queryKey: ['logbook', 'tags'],
    queryFn: ({ signal }) => fetchTags({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
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