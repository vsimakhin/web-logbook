import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
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
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['persons-for-log', id],
    queryFn: ({ signal }) => fetchPersonsForLog({ signal, logUuid: id, navigate }),
    enabled: !(id === "new"),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load persons' });

  const ActionButtons = memo(function ActionButtons({ id }) {
    return (
      <>
        <AddFlightrecordPersonButton id={id} />
      </>
    );
  });

  return (
    <>
      {isLoading && <LinearProgress />}
      {id !== "new" && (
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <CardHeader title="Persons" action={<ActionButtons id={id} />} />
            {(data && data.length) ? data.map((person) => (
              <PersonForLog key={person.uuid} person={person} logUuid={id} />
            )) : (
              <i>No persons on this flight</i>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default FlightRecordPersons;
