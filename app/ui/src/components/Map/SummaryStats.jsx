import Grid from "@mui/material/Grid2";
// Custom
import Tile from "../UIElements/Tile";
import { getStats } from "../../util/helpers";

const size = { xs: 6, sm: 4, md: 12, lg: 6, xl: 6 };

export const SummaryStats = ({ data }) => {
  const stats = getStats(data);

  return (
    <Grid container spacing={1}>
      <Tile title="Total Time" value={stats.totals.time.total_time} size={size} />
      <Tile title="Total Flights" value={data.length} size={size} />
      <Tile title="Airports" value={stats.airports} size={size} />
      <Tile title="Routes" value={stats.routes} size={size} />
      <Tile title="Distance (nm)" value={stats.totals.distance.toLocaleString(undefined, { maximumFractionDigits: 2 })} size={size} />
      <Tile title="Landings (D/N)" value={`${stats.totals.landings.day}/${stats.totals.landings.night}`} size={size} />
    </Grid>
  );
}

export default SummaryStats;