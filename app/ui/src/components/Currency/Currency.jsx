import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import CardHeader from "../UIElements/CardHeader";
import CurrencyTable from "./CurrencyTable";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../util/http/logbook";
import { fetchAircrafts } from "../../util/http/aircraft";
import { fetchCurrency } from "../../util/http/currency";

export const Currency = () => {
  // load all data
  const { data: logbookData = [], isLoading: isLogbookDataLoading, isError: isLogbookDataError, error: logbookDataError } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isLogbookDataError, logbookDataError, fallbackMessage: 'Failed to load logbook data' });

  const { data: currencyData = [], isLoading: isCurrencyDataLoading, isError, error } = useQuery({
    queryKey: ['currency'],
    queryFn: ({ signal }) => fetchCurrency({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load currencies' });

  const { data: aircrafts = [], isLoading: isAircraftsLoading } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  })

  if (isLogbookDataLoading || isCurrencyDataLoading || isAircraftsLoading) return <LinearProgress />;

  return (
    <Grid container spacing={1} >
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <CardHeader title="Currency" />
            <CurrencyTable logbookData={logbookData} currencyData={currencyData} aircrafts={aircrafts} />
          </CardContent>
        </Card >
      </Grid>
    </Grid>
  );
}

export default Currency;