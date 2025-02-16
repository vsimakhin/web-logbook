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
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../util/http/logbook";
import DashboardTiles from "./DashboardTiles";

export const TotalsDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [filter, setFilter] = useState({});
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const callbackFunction = (filteredData, filter) => {
    setDashboardData(filteredData);
    setFilter(filter);
  }

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Filters" />
              <Filters data={data} callbackFunction={callbackFunction} options={{ showNoRoutes: false, defaultQuickSelect: "All Time", showStatsFilters: true }} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 9, lg: 9, xl: 9 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Stats" />
              <DashboardTiles data={dashboardData} filter={filter} />
            </CardContent>
          </Card >
        </Grid>
      </Grid>
    </>
  );
}

export default TotalsDashboard;