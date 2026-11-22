import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid";
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
import { fetchVisitedAirports } from "../../util/http/airport";
import { queryClient } from "../../util/http/http";

export const SummaryFlightMap = () => {
  const [mapData, setMapData] = useState([]);
  // const [airportsMap, setAirportsMap] = useState(new Map());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook', 'map'],
    queryFn: ({ signal }) => fetchLogbookMapData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: airports, isLoading: airportsLoading } = useQuery({
    queryKey: ['airports', 'visited'],
    queryFn: async ({ signal }) => {
      const list = await fetchVisitedAirports({ signal });
      // Seed the single-airport cache so getAirportData never refetches these
      list.forEach(a => {
        queryClient.setQueryData(['airports', a.icao], a);
        if (a.iata) queryClient.setQueryData(['airports', a.iata], a);
      });
      return list;
    },
    staleTime: 3600000,
    gcTime: 3600000,
  });

  const airportsMap = useMemo(() => {
    const map = new Map();
    airports?.forEach(a => {
      map.set(a.icao, a);
      if (a.iata) map.set(a.iata, a);
    });
    return map;
  }, [airports]);

  const callbackFunction = useCallback((filteredData) => { setMapData(filteredData) }, [setMapData]);

  return (
    <>
      {(isLoading || airportsLoading) && <LinearProgress />}
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
              <SummaryStats data={mapData} airportsMap={airportsMap} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 9, lg: 9, xl: 9 }}>
          <FlightMap data={mapData} airportsMap={airportsMap} />
        </Grid>
      </Grid>
    </>
  );
}

export default SummaryFlightMap;