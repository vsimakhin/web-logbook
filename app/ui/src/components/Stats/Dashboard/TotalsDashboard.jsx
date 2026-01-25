import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import CardHeader from "../../UIElements/CardHeader";
import Filters from "../../UIElements/Filters";
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import DashboardTiles from "./DashboardTiles";
import CustomFieldsTiles from "./CustomFieldsTiles";
import useCustomFields from "../../../hooks/useCustomFields";
import { fetchAirports } from "../../../util/http/airport";

export const TotalsDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [filter, setFilter] = useState({});
  const [airportsMap, setAirportsMap] = useState(new Map());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
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

  const { customFields } = useCustomFields();

  const callbackFunction = useCallback((filteredData, filter) => {
    setDashboardData(filteredData);
    setFilter(filter);
  }, []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Filters" />
              <Filters data={data} callbackFunction={callbackFunction} options={{ showMapSelectors: false, defaultQuickSelect: "All Time", showStatsFilters: true }} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 9, lg: 9, xl: 9 }}>
          <DashboardTiles data={dashboardData} filter={filter} airportsMap={airportsMap} />
          <CustomFieldsTiles data={dashboardData} customFields={customFields} />
        </Grid>
      </Grid>
    </>
  );
}

export default TotalsDashboard;