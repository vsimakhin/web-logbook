import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";
import LinearProgress from "@mui/material/LinearProgress";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchPersonByUuid } from "../../util/http/person";
import CardHeader from "../UIElements/CardHeader";
import { printPerson } from "../../util/helpers";
import PersonsViewFlightsTable from "./PersonViewFlightsTable";

export const PersonView = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const { data: personData, isLoading: personIsLoading, isError: personIsError, error: personError } = useQuery({
    queryKey: ["person-view", uuid],
    queryFn: ({ signal }) => fetchPersonByUuid({ signal, uuid, navigate }),
  });
  useErrorNotification({
    isError: personIsError,
    error: personError,
    fallbackMessage: "Failed to load person",
  });

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 8, xl: 8 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Flights" />
              <PersonsViewFlightsTable uuid={uuid}/>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 4, xl: 4 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            {personIsLoading && <LinearProgress />}
              <CardContent>
            {personData && (
                <CardHeader title={printPerson(personData)} />
              )}
              </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default PersonView;
