import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import CardHeader from "../../UIElements/CardHeader";
import Filters from "../../UIElements/Filters";
import { useErrorNotification } from "../../../hooks/useAppNotifications";
import { fetchLogbookData } from "../../../util/http/logbook";
import DashboardTiles from "./DashboardTiles";
import CustomFieldsTiles from "./CustomFieldsTiles";
import useCustomFields from "../../../hooks/useCustomFields";
import { fetchAirports } from "../../../util/http/airport";
import { useLocalStorageState, CODEC_JSON } from "../../../hooks/useLocalStorageState";
import DashboardOptions from "./DashboardOptions";
import useSettings from "../../../hooks/useSettings";

export const TotalsDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [dashboardOptions, setDashboardOptions] = useLocalStorageState("dashboard-options", {}, { codec: CODEC_JSON });
  const [airportsMap, setAirportsMap] = useState(new Map());
  const { settings } = useSettings();

  const { data: rawData, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    select: (data) => data || [],
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load logbook' });

  const data = useMemo(() => {
    if (!rawData) return rawData;
    if (!settings || !settings.previous_experience) return rawData;

    const prev = settings.previous_experience;

    const artificialFlight = {
      uuid: "previous-experience-artificial-uuid",
      date: "17/12/1903",
      departure: { place: "" },
      arrival: { place: "" },
      aircraft: { reg_name: "", model: "" },
      time: {
        se_time: prev.se_time || "",
        me_time: prev.me_total_time || "",
        mcc_time: prev.mcc_time || "",
        total_time: prev.total_time || "",
        night_time: prev.night_time || "",
        ifr_time: prev.ifr_time || "",
        pic_time: prev.pic_time || "",
        co_pilot_time: prev.co_pilot_time || "",
        dual_time: prev.dual_time || "",
        instructor_time: prev.instructor_time || "",
        cc_time: prev.cc_time || "",
      },
      landings: {
        day: prev.landings_day || 0,
        night: prev.landings_night || 0,
      },
      sim: {
        type: "",
        time: prev.sim_time || "",
      },
      distance: 0,
      custom_fields: {},
      tags: "",
    };

    return [artificialFlight, ...rawData];
  }, [rawData, settings]);

  const { data: airports } = useQuery({
    queryKey: ['airports'],
    queryFn: ({ signal }) => fetchAirports({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
  });

  useEffect(() => {
    if (airports) {
      const map = new Map();
      airports.forEach(a => {
        map.set(a.icao, a);
        if (a.iata) {
          map.set(a.iata, a);
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAirportsMap(map);
    }
  }, [airports]);

  const { customFields } = useCustomFields();

  const callbackFunction = useCallback((filteredData) => { setDashboardData(filteredData) }, []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Filters" />
              <Filters data={data} callbackFunction={callbackFunction} quickSelect={"All Time"} />
            </CardContent>
          </Card >
          <DashboardOptions dashboardOptions={dashboardOptions} setDashboardOptions={setDashboardOptions} />

        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 9, lg: 9, xl: 9 }}>
          <DashboardTiles data={dashboardData} dashboardOptions={dashboardOptions} airportsMap={airportsMap} />
          <CustomFieldsTiles data={dashboardData} customFields={customFields} />
        </Grid>
      </Grid>
    </>
  );
}

export default TotalsDashboard;