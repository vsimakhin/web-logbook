
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
// MUI
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogsForPerson, fetchPersonByUuid } from "../../util/http/person";
import CardHeader from "../UIElements/CardHeader";
import { printPerson } from "../../util/helpers";
import PersonsViewFlightsTable from "./PersonViewFlightsTable";
import { PersonDataCard } from "./PersonDataCard";
import SavePersonButton from "./SavePersonButton";

export const PersonView = () => {
  const { uuid } = useParams();
  const [person, setPerson] = useState({});

  const handleChange = useCallback((key, value) => {
    setPerson((prev) => ({ ...prev, [key]: value }));
  }, []);

  const { data: personData, isLoading: personIsLoading, isError: personIsError, error: personError } = useQuery({
    queryKey: ["persons", "person", uuid],
    queryFn: ({ signal }) => fetchPersonByUuid({ signal, uuid }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError: personIsError, error: personError, fallbackMessage: "Failed to load person" });

  const { data: personFlightsData, isLoading: personFlightsIsLoading, isError: personFlightsIsError, error: personFlightsError } = useQuery({
    queryKey: ["persons", "flights", uuid],
    queryFn: ({ signal }) => fetchLogsForPerson({ signal, personUuid: uuid }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: personFlightsIsError, error: personFlightsError, fallbackMessage: "Failed to load flights" });

  const flightsTitle = useMemo(() => `${printPerson(personData)} Flights`, [personData]);

  useEffect(() => {
    if (personData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPerson(personData);
    }
  }, [personData]);

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 8, xl: 8 }}>
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <CardHeader title={flightsTitle} />
            <PersonsViewFlightsTable data={personFlightsData} isLoading={personFlightsIsLoading} />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 4, xl: 4 }}>
        <Card variant="outlined" sx={{ mb: 1 }}>
          {personIsLoading && <LinearProgress />}
          <CardContent>
            <CardHeader title={"Person data"} action={<SavePersonButton person={person} isNew={false} onClose={() => (null)} />} />
            {personData && <PersonDataCard person={person} handleChange={handleChange} />}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PersonView;
