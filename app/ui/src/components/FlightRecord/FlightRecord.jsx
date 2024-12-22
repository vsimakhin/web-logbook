import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import CardHeader from "../UIElements/CardHeader";
import FlightRecordDetails from "./FlightRecordDetails";
import { fetchFlightData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";

export const FlightRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <FlightRecordDetails flightData={data} />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title={"Map"} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default FlightRecord;