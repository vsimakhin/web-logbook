import { use, useCallback, useState } from "react";
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
import { fetchLogbookMapData } from "../../util/http/logbook";
import SummaryStats from "./SummaryStats";
import useCustomFields from "../../hooks/useCustomFields";

export const SummaryFlightMap = () => {
  const [options, setOptions] = useState({ routes: true, tracks: false });
  const [mapData, setMapData] = useState([]);
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook', 'map'],
    queryFn: ({ signal }) => fetchLogbookMapData({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { getEnroute } = useCustomFields();

  const callbackFunction = useCallback((filteredData, filter) => {
    setMapData(filteredData);

    setOptions((prev) => ({
      ...prev,
      routes: filter.routes,
      tracks: filter.tracks,
    }));
  }, [setMapData]);

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
          <FlightMap data={mapData} options={options} getEnroute={getEnroute} />
        </Grid>
      </Grid>
    </>
  );
}

export default SummaryFlightMap;