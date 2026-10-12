// Custom components
import Select from "../UIElements/Select";
import useSettings from "../../hooks/useSettings";
import { useLogbookQuery } from "../../hooks/queries";

const getUniquePlaces = (flights, type) => {
  if (!flights) {
    return [];
  }

  const places = new Set();

  flights.forEach((flight) => {
    const place = flight[type]?.place;

    if (place) {
      places.add(place);
    }
  });

  return [...places].sort();
};

export const DepartureArrival = ({ gsize, type, value, handleChange, ...props }) => {
  const { fieldNameF } = useSettings();
  const label = fieldNameF(type);

  const { data } = useLogbookQuery()
  const options = getUniquePlaces(data, type);

  return (
    <Select
      gsize={gsize}
      id={type}
      label={label}
      handleChange={handleChange}
      onBlur={(e) => handleChange(type, e.target.value)}
      value={value}
      tooltip={label}
      options={options || []}
      freeSolo={true}
      {...props}
    />
  );
};

export default DepartureArrival;
