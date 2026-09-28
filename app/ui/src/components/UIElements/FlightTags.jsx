import Select from "./Select";
import { useLogbookQuery } from "../../hooks/queries";
import { useMemo } from "react";

const getUniqueTags = (flights = []) => {
  return [
    ...new Set(
      flights
        .flatMap((flight) => flight.tags.split(','))
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ];
};

export const FlightTags = ({ gsize, id = "tags", label = "Tags", value, handleChange, ...props }) => {
  const { data } = useLogbookQuery()
  const options = useMemo(() => getUniqueTags(data), [data]);

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