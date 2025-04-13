import { useNavigate, useParams } from "react-router-dom";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import FlightRecordDetails from "./FlightRecordDetails";
import { fetchFlightData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { FLIGHT_INITIAL_STATE } from "../../constants/constants";
import FlightMap from "../FlightMap/FlightMap";
import HelpButton from "./HelpButton";
import NewFlightRecordButton from "./NewFlightRecordButton";
import CopyFlightRecordButton from "./CopyFlightRecordButton";
import SaveFlightRecordButton from "./SaveFlightRecordButton";
import DeleteFlightRecordButton from "./DeleteFlightRecordButton";
import Attachments from "../Attachment/Attachments";
import ResetTrackButton from "./ResetTrackButton";

const ActionButtons = memo(({ flight, handleChange, setFlight }) => (
  <>
    <HelpButton />
    <SaveFlightRecordButton flight={flight} handleChange={handleChange} />
    {flight.uuid !== "new" && <NewFlightRecordButton setFlight={setFlight} />}
    {flight.uuid !== "new" && <CopyFlightRecordButton setFlight={setFlight} />}
    {flight.track && <ResetTrackButton flight={flight} handleChange={handleChange} />}
    {flight.uuid !== "new" && <DeleteFlightRecordButton flight={flight} />}
  </>
));

export const FlightRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [flight, setFlight] = useState({ ...FLIGHT_INITIAL_STATE, uuid: id });
  const [mapData, setMapData] = useState([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id, navigate }),
    enabled: id !== "new",
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load flight record' });

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

  const gridSize = useMemo(() => ({
    xs: 12, sm: 12, md: 6, lg: 6, xl: 6
  }), []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={gridSize}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Flight Record"
                action={<ActionButtons flight={flight} handleChange={handleChange} setFlight={setFlight} />}
              />
              <FlightRecordDetails flight={flight} handleChange={handleChange} />
            </CardContent>
          </Card >

          <Attachments id={id} />
        </Grid>

        <Grid size={gridSize}>
          <FlightMap data={mapData} />
        </Grid>
      </Grid>
    </>
  );
}

export default FlightRecord;