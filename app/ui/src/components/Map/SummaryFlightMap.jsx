import { useCallback, useEffect, useState } from "react";
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
import useCustomFields from "../../hooks/useCustomFields";
import { fetchAirports } from "../../util/http/airport";
import MapOptions from "./MapOptions";
import { useLocalStorageState } from "@toolpad/core/useLocalStorageState";
import { tableJSONCodec } from "../../constants/constants";

export const SummaryFlightMap = () => {
  // const [options, setOptions] = useState({ routes: true, tracks: false });
  const [options, setOptions] = useLocalStorageState("map-options", { routes: true, tracks: false, airport_ids: true, icon: 'ico' }, { codec: tableJSONCodec });

  const [mapData, setMapData] = useState([]);
  const [airportsMap, setAirportsMap] = useState(new Map());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook', 'map'],
    queryFn: ({ signal }) => fetchLogbookMapData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: airports } = useQuery({
    queryKey: ['airports'],
    queryFn: ({ signal }) => fetchAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  useEffect(() => {
    if (airports) {
      const map = new Map();
      airports.forEach(a => {
        map.set(a.icao, a);
        if (a.iata) {
          map.set(a.iata, a);
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAirportsMap(map);
    }
  }, [airports]);

  const { getEnroute } = useCustomFields();

  const callbackFunction = useCallback((filteredData) => { setMapData(filteredData) }, [setMapData]);

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
          <MapOptions options={options} setOptions={setOptions} />
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Stats" />
              <SummaryStats data={mapData} airportsMap={airportsMap} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 9, lg: 9, xl: 9 }}>
          <FlightMap data={mapData} options={options} getEnroute={getEnroute} airportsMap={airportsMap} />
        </Grid>
      </Grid>
    </>
  );
}

export default SummaryFlightMap;