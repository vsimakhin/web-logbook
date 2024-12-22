import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { fetchLogbookData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import LogbookTable from "./LogbookTable";
import { createColumn, createDateColumn, createLandingColumn, createTimeColumn, renderHeader, renderProps, renderTextProps, renderTotalFooter } from "./helpers";

export const Logbook = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook'],
    queryFn: ({ signal }) => fetchLogbookData({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load aircrafts list' });

  const columns = useMemo(() => [
    {
      header: "Date", ...renderTextProps, columns: [
        createDateColumn("date", "", 90),
      ]
    },
    {
      header: "Departure", ...renderProps, columns: [
        createColumn("departure.place", "Place", 55),
        createColumn("departure.time", "Time", 50)
      ]
    },
    {
      header: "Arrival", columns: [
        createColumn("arrival.place", "Place", 55),
        createColumn("arrival.time", "Time", 50)
      ]
    },
    {
      header: "Aircraft", columns: [
        createColumn("aircraft.model", "Type", 80),
        createColumn("aircraft.reg_name", "Reg", 80, false, renderTotalFooter())
      ]
    },
    {
      header: "Single Pilot", columns: [
        createTimeColumn("time.se_time", "SE"),
        createTimeColumn("time.me_time", "ME"),
      ]
    },
    {
      header: "MCC", columns: [
        createTimeColumn("time.mcc_time", "MCC")
      ]
    },
    {
      header: "Total", columns: [
        createTimeColumn("time.total_time", "")
      ]
    },
    {
      header: "PIC Name", columns: [
        createColumn("pic_name", "", 150, true)
      ]
    },
    {
      header: "Landings", columns: [
        createLandingColumn("landings.day", "Day"),
        createLandingColumn("landings.night", "Night")
      ]
    },
    {
      Header: renderHeader(["Operation", "Condition Time"]),
      header: "OCT", columns: [
        createTimeColumn("time.night_time", "Night"),
        createTimeColumn("time.ifr_time", "IFR"),
      ]
    },
    {
      header: "Pilot Function Time", columns: [
        createTimeColumn("time.pic_time", "PIC"),
        createTimeColumn("time.co_pilot_time", "COP"),
        createTimeColumn("time.dual_time", "Dual"),
        createTimeColumn("time.instructor_time", "Instr")
      ]
    },
    {
      header: "FSTD Session", columns: [
        createColumn("sim.type", "Type", 70),
        createTimeColumn("sim.time", "Time")
      ]
    },
    {
      header: "Remarks", grow: true, columns: [
        { accessorKey: "remarks", header: "", grow: true, ...renderTextProps },
      ]
    }
  ], []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <LogbookTable
        columns={columns}
        data={data}
        isLoading={isLoading}
      />
    </>
  );
}

export default Logbook;