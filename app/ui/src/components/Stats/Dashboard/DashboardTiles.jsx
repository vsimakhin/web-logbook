import { useMemo } from "react";
// MUI
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
// Custom
import CardHeader from "../../UIElements/CardHeader";
import Tile from "../../UIElements/Tile";
import { getStats, getValue } from "../../../util/helpers";
import useSettings from '../../../hooks/useSettings';

const size = { xs: 6, sm: 3, md: 3, lg: 2, xl: 2 };

export const DashboardTiles = ({ data, filter, airportsMap }) => {
  const stats = useMemo(() => getStats(data, airportsMap), [data, airportsMap]);
  const { fieldNameF } = useSettings();

  const tiles = useMemo(() => [
    { key: "total_time", title: fieldNameF("total"), path: "totals.time.total_time" },
    { key: "se_time", title: fieldNameF("se"), path: "totals.time.se_time" },
    { key: "me_time", title: fieldNameF("me"), path: "totals.time.me_time" },
    { key: "mcc_time", title: fieldNameF("mcc"), path: "totals.time.mcc_time" },
    { key: "night_time", title: fieldNameF("night"), path: "totals.time.night_time" },
    { key: "ifr_time", title: fieldNameF("ifr"), path: "totals.time.ifr_time" },
    { key: "pic_time", title: fieldNameF("pic"), path: "totals.time.pic_time" },
    { key: "co_pilot_time", title: fieldNameF("cop"), path: "totals.time.co_pilot_time" },
    { key: "dual_time", title: fieldNameF("dual"), path: "totals.time.dual_time" },
    { key: "instructor_time", title: fieldNameF("instr"), path: "totals.time.instructor_time" },
    { key: "cc_time", title: "Cross-Country", path: "totals.time.cc_time" },
    { key: "sim_time", title: `${fieldNameF("fstd")} ${fieldNameF("sim_time")}`, path: "totals.sim.time" },
    { key: "landings", title: `${fieldNameF("landings")} (${fieldNameF("land_day")}/${fieldNameF("land_night")})`, path: "totals.landings", format: (val) => `${val.day}/${val.night}` },
  ], [fieldNameF]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Stats" />
        <Grid container spacing={1}>
          {tiles.filter(({ key }) => filter?.show?.[key] ?? true) // Apply filtering
            .map(({ key, title, path, format }) => {
              const value = getValue(stats, path);
              return <Tile key={key} title={title} value={format ? format(value) : value} size={size} />;
            })}
        </Grid>
        <Divider orientation="horizontal" sx={{ m: 1 }} />
        <Grid container spacing={1}>
          <Tile title="Total Flights" value={data.length} size={size} />
          <Tile title="Airports" value={stats.airports} size={size} />
          <Tile title="Routes" value={stats.routes} size={size} />
          <Tile title="Countries" value={stats.countries} size={size} />
          <Tile title="Aircrafts" value={stats.aircraftRegs} size={size} />
          <Tile title="Aircraft Types" value={stats.aircraftModels} size={size} />
          <Tile title="Distance (nm)" value={stats.totals.distance.toLocaleString(undefined, { maximumFractionDigits: 0 })} size={size} />
        </Grid>
      </CardContent>
    </Card >
  );
};

export default DashboardTiles;