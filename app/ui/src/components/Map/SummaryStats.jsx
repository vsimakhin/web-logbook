import Grid from "@mui/material/Grid2";
// Custom
import Tile from "../UIElements/Tile";
import { convertMinutesToTime, convertTimeToMinutes } from "../../util/helpers";

const size = { xs: 6, sm: 4, md: 6, lg: 6, xl: 6 };

const getStats = (data) => {
  const airports = new Set();
  const routes = new Set();
  let totalTimeMinutes = 0;
  let dayLandings = 0;
  let nightLandings = 0;

  data.forEach(flight => {
    if (flight.departure.place) airports.add(flight.departure.place);
    if (flight.arrival.place) airports.add(flight.arrival.place);

    if (flight.departure.place && flight.arrival.place) {
      const routePoints = [flight.departure.place, flight.arrival.place].sort();
      routes.add(`${routePoints[0]}-${routePoints[1]}`);
    }

    totalTimeMinutes += convertTimeToMinutes(flight.time.total_time);
    dayLandings += parseInt(flight.landings.day) || 0;
    nightLandings += parseInt(flight.landings.night) || 0;
  });

  return {
    airports: airports.size,
    routes: routes.size,
    totalTime: convertMinutesToTime(totalTimeMinutes),
    dayLandings,
    nightLandings,
  };
};

export const SummaryStats = ({ data }) => {
  const stats = getStats(data);

  return (
    <>
      <Grid container spacing={1}>
        <Tile title="Total Flights" value={data.length} size={size} />
        <Tile title="Airports" value={stats.airports} size={size} />
        <Tile title="Routes" value={stats.routes} size={size} />
        <Tile title="Total Time" value={stats.totalTime} size={size} />
        <Tile title="Landings (D/N)" value={`${stats.dayLandings}/${stats.nightLandings}`} size={size} />
      </Grid>
    </>
  );
}

export default SummaryStats;