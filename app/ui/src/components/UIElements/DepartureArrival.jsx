import { useQuery } from "@tanstack/react-query";
// Custom components
import Select from "../UIElements/Select";
import useSettings from "../../hooks/useSettings";
import { fetchLogbookData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";

const getUniquePlaces = (flights) => {
  if (!flights) {
    return { departure: [], arrivals: [] };
  }

  const departure = new Set();
  const arrival = new Set();

  flights.forEach((flight) => {
    if (flight.departure?.place) {
      departure.add(flight.departure.place);
    }

    if (flight.arrival?.place) {
      arrival.add(flight.arrival.place);
    }
  });

  return {
    departure: [...departure].sort(),
    arrival: [...arrival].sort(),
  };
};

export const DepartureArrival = ({
  gsize,
  type,
  value,
  preloadedData,
  handleChange,
  ...props
}) => {
  const { fieldNameF } = useSettings();
  const label = fieldNameF(type);

  const { data, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    enabled: !preloadedData,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load departures/arrivals' });

  const places = getUniquePlaces(data);
  const options = places[type];

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
