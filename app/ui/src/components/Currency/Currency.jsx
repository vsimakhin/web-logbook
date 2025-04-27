import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import { fetchLogbookData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { useEffect } from "react";


const evaluateCurrency = (flights, rule) => {
  const now = dayjs();
  const since = now.subtract(rule.timeframe.value, rule.timeframe.unit);

  const total = flights
    .filter(flight => {
      const flightDate = dayjs(flight.date, "DD/MM/YYYY");
      if (!flightDate.isValid() || flightDate.isBefore(since)) return false;

      for (const [key, expected] of Object.entries(rule.filters || {})) {
        const value = key.split('.').reduce((obj, k) => obj?.[k], flight);
        if (value !== expected) return false;
      }

      return true;
    })
    .reduce((sum, flight) => {
      const value = rule.metric.split('.').reduce((obj, k) => obj?.[k], flight);
      return sum + (parseFloat(value) || 0);
    }, 0);

  const result = {
    current: total,
    meetsRequirement: eval(`${total} ${rule.comparison} ${rule.targetValue}`),
  };

  return result;
};

const userCurrencyRule = {
  id: "rule-1",
  name: "90-Day Landing Currency",
  metric: "landings.day", // dot-notation path to value
  targetValue: 3,
  timeframe: {
    unit: "days",
    value: 90
  },
  comparison: ">=", // could be '>=', '=', '<'
  filters: {
    "aircraft.model": "PC-24" // supports nested paths
  }
};

export const Currency = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  useEffect(() => {
    if (data) {
      const status = evaluateCurrency(data, userCurrencyRule);
      console.log("Currency status:", status);
    }

  }, [data]);

  return (
    <>
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Currency" />

            </CardContent>
          </Card >
        </Grid>
      </Grid>
    </>
  );
}

export default Currency;