import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
// Custom
import Tile from "../../UIElements/Tile";
import { getStats, getValue } from "../../../util/helpers";

const size = { xs: 6, sm: 3, md: 3, lg: 2, xl: 2 };

export const DashboardTiles = ({ data, filter }) => {
  const stats = getStats(data);

  return (
    <>
      <Grid container spacing={1}>
        {[
          { key: "total_time", title: "Total Time", path: "totals.time.total_time" },
          { key: "se_time", title: "Single Engine", path: "totals.time.se_time" },
          { key: "me_time", title: "Multi Engine", path: "totals.time.me_time" },
          { key: "mcc_time", title: "MCC", path: "totals.time.mcc_time" },
          { key: "night_time", title: "Night", path: "totals.time.night_time" },
          { key: "ifr_time", title: "IFR", path: "totals.time.ifr_time" },
          { key: "pic_time", title: "PIC", path: "totals.time.pic_time" },
          { key: "co_pilot_time", title: "Co-Pilot", path: "totals.time.co_pilot_time" },
          { key: "dual_time", title: "Dual", path: "totals.time.dual_time" },
          { key: "instructor_time", title: "Instructor", path: "totals.time.instructor_time" },
          { key: "cc_time", title: "Cross-Country", path: "totals.time.cc_time" },
          { key: "sim_time", title: "Simulator", path: "totals.sim.time" },
          { key: "landings", title: "Landings (D/N)", path: "totals.landings", format: (val) => `${val.day}/${val.night}` },
        ]
          .filter(({ key }) => filter?.show?.[key] ?? true) // Apply filtering
          .map(({ title, path, format }) => {
            const value = getValue(stats, path);
            return <Tile key={title} title={title} value={format ? format(value) : value} size={size} />;
          })}
      </Grid>
      <Divider orientation="horizontal" sx={{ m: 1 }} />
      <Grid container spacing={1}>
        <Tile title="Total Flights" value={data.length} size={size} />
        <Tile title="Airports" value={stats.airports} size={size} />
        <Tile title="Routes" value={stats.routes} size={size} />
        <Tile title="Aircrafts" value={stats.aircraftRegs} size={size} />
        <Tile title="Aircraft Types" value={stats.aircraftModels} size={size} />
        <Tile title="Distance (nm)" value={stats.totals.distance.toLocaleString(undefined, { maximumFractionDigits: 0 })} size={size} />
      </Grid>
    </>
  );
}

export default DashboardTiles;