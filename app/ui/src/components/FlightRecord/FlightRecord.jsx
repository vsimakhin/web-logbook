import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import FlightRecordDetails from "./FlightRecordDetails";
import { fetchFlightData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";
import FlightMap from "../Map/FlightMap";

export const FlightRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(FLIGHT_INITIAL_STATE);
  const [mapData, setMapData] = useState([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

  useEffect(() => {
    if (data) {
      setFlight(data);
      setMapData([{ departure: data.departure, arrival: data.arrival }]);
    }
  }, [data]);

  useEffect(() => {
    if (flight.map) {
      setMapData([flight.map]);
    }
  }, [flight.map]);

  const handleChange = (key, value) => {
    setFlight((flight) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedFlight = { ...flight }; // Create a shallow copy of the flight object
      let current = updatedFlight;

      // Traverse and create nested objects as needed
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Update the final key with the new value
          current[k] = value;
        } else {
          // Ensure the next level exists
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedFlight;
    });
  };

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <FlightRecordDetails flight={flight} handleChange={handleChange} />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <FlightMap data={mapData} />
        </Grid>
      </Grid>
    </>
  );
}

export default FlightRecord;