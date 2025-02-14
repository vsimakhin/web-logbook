import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import CardHeader from "../UIElements/CardHeader";
import { MAP_FILTER_INITIAL_STATE } from "../../constants/constants";
import Filters from "./Filters";
import FlightMap from "../FlightMap/FlightMap";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../util/http/logbook";
import { fetchAircraftModelsCategories } from "../../util/http/aircraft";
import SummaryStats from "./SummaryStats";

const getModelsByCategory = (modelsData, category) => {
  if (!category || !modelsData) return [];
  return modelsData
    .filter(item => item.category.split(',').map(c => c.trim()).includes(category))
    .map(item => item.model);
};

const filterData = (data, filter, modelsData) => {
  // Filter data
  const filteredData = data.filter((flight) => {
    // filter by date
    const flightDate = dayjs(flight.date, 'DD/MM/YYYY');
    const matchesDate = flightDate.isBetween(filter.start_date, filter.end_date, null, '[]');

    // filter registration
    const matchesReg = filter.aircraft_reg ? flight.aircraft.reg_name === filter.aircraft_reg : true;

    // filter type
    const matchesType = filter.aircraft_model ? flight.aircraft.model === filter.aircraft_model : true;

    // filter category
    const matchesCategory = filter.aircraft_category ?
      getModelsByCategory(modelsData, filter.aircraft_category).includes(flight.aircraft.model) : true;

    // filter arrival and departure place
    const matchesArrival = filter.place ? flight.arrival.place.toUpperCase().includes(filter.place.toUpperCase()) : true;
    const matchesDeparture = filter.place ? flight.departure.place.toUpperCase().includes(filter.place.toUpperCase()) : true;

    return matchesDate & matchesReg && matchesType && matchesCategory && (matchesArrival || matchesDeparture);
  });

  return filteredData;
}

export const SummaryFlightMap = () => {
  const [filter, setFilter] = useState(MAP_FILTER_INITIAL_STATE);
  const [mapData, setMapData] = useState([]);
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const { data: modelsData } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
  });

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!data) return;
    const filteredData = filterData(data, filter, modelsData);
    setMapData(filteredData);
  }, [data, filter, modelsData]);

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Filters" />
              <Filters filter={filter} handleChange={handleFilterChange} />
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
          <FlightMap data={mapData} routes={!filter.no_routes} />
        </Grid>
      </Grid>
    </>
  );
}

export default SummaryFlightMap;