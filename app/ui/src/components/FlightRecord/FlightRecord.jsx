import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import FlightRecordDetails from "./FlightRecordDetails";
import { fetchFlightData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";
import FlightMap from "../FlightMap/FlightMap";
import Attachments from "../Attachment/Attachments";
import CustomFields from "./CustomFields";
import FlightRecordPersons from "../Persons/FlightRecordPersons";
import useCustomFields from "../../hooks/useCustomFields";

const gridSize = { xs: 12, sm: 12, md: 6, lg: 6, xl: 6 };

export const FlightRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [flight, setFlight] = useState({ ...FLIGHT_INITIAL_STATE, uuid: id });
  const [mapData, setMapData] = useState([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id, navigate }),
    enabled: id !== "new",
    refetchOnWindowFocus: false,
    staleTime: 3600000,
    gcTime: 3600000,
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

  const { customFields, getEnroute } = useCustomFields();

  useEffect(() => {
    if (data) {
      data.redraw = Math.random(); // trigger map redraw
      setFlight(data);
    }
  }, [data]);

  useEffect(() => {
    if (flight) {
      setMapData([flight]);
    }
  }, [flight.redraw, flight.distance]);

  const handleChange = useCallback((key, value) => {
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
  }, []);

  const options = flight?.track ? { routes: false, tracks: true } : { routes: true, tracks: false };

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1}>
        <Grid size={gridSize}>
          <FlightRecordDetails flight={flight} handleChange={handleChange} setFlight={setFlight} />
          <CustomFields flight={flight} customFields={customFields} handleChange={handleChange} />
          <Attachments id={id} />
          <FlightRecordPersons id={id} />
        </Grid>

        <Grid size={gridSize}>
          <FlightMap data={mapData} options={options} getEnroute={getEnroute} />
        </Grid>
      </Grid>
    </>
  );
}

export default FlightRecord;