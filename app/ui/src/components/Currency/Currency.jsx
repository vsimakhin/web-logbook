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
import CurrencyTable from "./CurrencyTable";

const getStartDate = (unit, value) => {
  const now = dayjs();
  switch (unit) {
    case "calendar_months":
      return now.startOf("day").subtract(value, "month");
    case "calendar_years":
      return now.startOf("day").subtract(value, "year");
    case "days":
    default:
      return now.subtract(value, "day");
  }
};

const parseMetricValue = (value) => {
  if (typeof value === "string" && value.includes(":")) {
    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours + minutes / 60;
  }
  return parseFloat(value) || 0;
};

const evaluateCurrency = (flights, rule, modelsData) => {
  const models = resolveModelsFromFilters(userCurrencyRule.filters, modelsData);

  const filteredFlights = flights.filter(flight => {
    const matchesModel = models.length === 0 || models.includes(flight.aircraft.model);
    return matchesModel;
  });

  const since = getStartDate(rule.timeframe.unit, rule.timeframe.value);

  // const now = dayjs();
  // const since = now.subtract(rule.timeframe.value, rule.timeframe.unit);

  const total = filteredFlights
    .filter(flight => {
      const flightDate = dayjs(flight.date, "DD/MM/YYYY");
      if (!flightDate.isValid() || flightDate.isBefore(since)) return false;
      return true;
    })
    .reduce((sum, flight) => {
      // const value = rule.metric.split('.').reduce((obj, k) => obj?.[k], flight);
      // return sum + parseMetricValue(value);
      let value;
      if (rule.metric === "landings.all") {
        const day = parseMetricValue(flight.landings?.day);
        const night = parseMetricValue(flight.landings?.night);
        value = day + night;
      } else {
        value = rule.metric.split('.').reduce((obj, k) => obj?.[k], flight);
        value = parseMetricValue(value);
      }
      return sum + value;
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
  metric: "landings.all",
  targetValue: 3,
  timeframe: {
    unit: "days",
    value: 180
  },
  comparison: ">=",
  filters: "PC-24, C525"
};

const userCurrencyRule1 = {
  id: "rule-1",
  name: "90-Day Landing Currency",
  metric: "time.total_time",
  targetValue: 12,
  timeframe: {
    unit: "days",
    value: 90
  },
  comparison: ">=",
  filters: "PC-24, C525"
};

const getModelsByCategory = (modelsData, category) => {
  if (!category || !modelsData) return [];
  return modelsData
    .filter(item => item.category.split(',').map(c => c.trim()).includes(category))
    .map(item => item.model);
};

const resolveModelsFromFilters = (filters, modelsData) => {
  const categories = filters.split(',').map(c => c.trim());
  const models = new Set();
  categories.forEach(cat => {
    getModelsByCategory(modelsData, cat).forEach(model => models.add(model));
  });
  return Array.from(models);
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

  const { data: modelsData } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
  });

  useEffect(() => {
    if (data) {

      console.log(evaluateCurrency(data, userCurrencyRule, modelsData));
      console.log(evaluateCurrency(data, userCurrencyRule1, modelsData));

    }

  }, [data]);

  return (
    <>
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Currency" />
              <CurrencyTable />
            </CardContent>
          </Card >
        </Grid>
      </Grid>
    </>
  );
}

export default Currency;