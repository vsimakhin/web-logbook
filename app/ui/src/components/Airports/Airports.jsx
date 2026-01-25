import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import StandardAirportsTable from "./StandardAirportsTable";
import AirportsDB from "./AirportsDB";
import CustomAirportsTable from "./CustomAirportsTable";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchCustomAirports, fetchStandardAirports } from "../../util/http/airport";

export const Airports = () => {
  const { data: standardAirportsData, isLoading: isStandardAirportsLoading, isError: isStandardAirportsError, error: standardAirportsError } = useQuery({
    queryKey: ['airports'],
    queryFn: ({ signal }) => fetchStandardAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isStandardAirportsError, standardAirportsError, fallbackMessage: 'Failed to load airports' });

  const { data: customAirportsData, isLoading: isCustomAirportsLoading, isError: isCustomAirportsError, error: customAirportsError } = useQuery({
    queryKey: ['custom-airports'],
    queryFn: ({ signal }) => fetchCustomAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isCustomAirportsError, customAirportsError, fallbackMessage: 'Failed to load airports' });

  return (
    <>
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <StandardAirportsTable data={standardAirportsData} isLoading={isStandardAirportsLoading} />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <AirportsDB />
            </CardContent>
          </Card >

          <CustomAirportsTable data={customAirportsData} isLoading={isCustomAirportsLoading} />
        </Grid>
      </Grid>
    </>
  );
}

export default Airports;