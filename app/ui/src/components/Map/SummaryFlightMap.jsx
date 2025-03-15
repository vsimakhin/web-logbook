import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import CardHeader from "../UIElements/CardHeader";
import Filters from "../UIElements/Filters";
import FlightMap from "../FlightMap/FlightMap";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../util/http/logbook";
import SummaryStats from "./SummaryStats";

export const SummaryFlightMap = () => {
  const [noRoutes, setNoRoutes] = useState(false);
  const [mapData, setMapData] = useState([]);
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
    staleTime: 3600000,
    cacheTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const callbackFunction = (filteredData, filter) => {
    setMapData(filteredData);
    setNoRoutes(filter.no_routes);
  }

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Filters" />
              <Filters data={data} callbackFunction={callbackFunction} />
            </CardContent>
          </Card >
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Stats" />
              <SummaryStats data={mapData} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 9, lg: 9, xl: 9 }}>
          <FlightMap data={mapData} routes={!noRoutes} />
        </Grid>
      </Grid>
    </>
  );
}

export default SummaryFlightMap;