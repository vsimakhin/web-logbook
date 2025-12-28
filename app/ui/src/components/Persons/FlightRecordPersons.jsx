import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import LinearProgress from "@mui/material/LinearProgress";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// Custom
import CardHeader from "../UIElements/CardHeader";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import AddFlightrecordPersonButton from "./AddFlightrecordPersonButton";
import { fetchPersonsForLog } from "../../util/http/person";
import PersonForLog from "./PersonForLog";

export const FlightRecordPersons = ({ id }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["persons", "log", id],
    queryFn: ({ signal }) => fetchPersonsForLog({ signal, logUuid: id }),
    enabled: !(id === "new"),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load persons' });

  return (
    <>
      {isLoading && <LinearProgress />}
      {id !== "new" && (
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <CardHeader title="Persons" action={<AddFlightrecordPersonButton id={id} />} />
            {(data && data.length) && data.map((person) => (
              <PersonForLog key={person.uuid} person={person} logUuid={id} />
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default FlightRecordPersons;
