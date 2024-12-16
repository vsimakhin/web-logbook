import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// MUI
import LinearProgress from "@mui/material/LinearProgress";
// Custom
import { fetchLogbookData } from "../../util/http/logbook";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { useMemo } from "react";
import { DataTable } from "../UIElements/DataTable";

const renderTextProps = {
  muiTableBodyCellProps: { align: "left", sx: { p: 0.5 } }, muiTableHeadCellProps: { align: "center" }
};
const renderProps = {
  muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } }, muiTableHeadCellProps: { align: "center" }
};

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
        { accessorKey: "date", header: "", size: 90, ...renderTextProps },
      ]
    },
    {
      header: "Departure", ...renderProps, columns: [
        { accessorKey: "departure.place", header: "Place", size: 55, ...renderProps },
        { accessorKey: "departure.time", header: "Time", size: 50, ...renderProps },
      ]
    },
    {
      header: "Arrival", columns: [
        { accessorKey: "arrival.place", header: "Place", size: 55, ...renderProps },
        { accessorKey: "arrival.time", header: "Time", size: 50, ...renderProps },
      ]
    },
    {
      header: "Aircraft", columns: [
        { accessorKey: "aircraft.model", header: "Type", size: 80, ...renderProps },
        { accessorKey: "aircraft.reg_name", header: "Reg", size: 80, ...renderProps },
      ]
    },
    {
      header: "Single Pilot", columns: [
        { accessorKey: "time.se_time", header: "SE", size: 50, ...renderProps },
        { accessorKey: "time.me_time", header: "ME", size: 50, ...renderProps },
      ]
    },
    {
      header: "MCC", columns: [
        { accessorKey: "time.mcc_time", header: "", size: 50, ...renderProps },
      ]
    },
    {
      header: "Total", columns: [
        { accessorKey: "time.total_time", header: "", size: 50, ...renderProps },
      ]
    },
    {
      header: "PIC Name", columns: [
        { accessorKey: "pic_name", header: "", size: 150, ...renderTextProps },
      ]
    },
    {
      header: "Landings", columns: [
        {
          accessorKey: "landings.day", header: "Day", size: 50, ...renderProps,
          Cell: ({ cell }) => (cell.getValue() === 0 ? "" : cell.getValue())
        },
        {
          accessorKey: "landings.night", header: "Night", size: 60, ...renderProps,
          Cell: ({ cell }) => (cell.getValue() === 0 ? "" : cell.getValue())
        },
      ]
    },
    {
      header: "Operational Condition Time", columns: [
        { accessorKey: "time.night_time", header: "Night", size: 60, ...renderProps },
        { accessorKey: "time.ifr_time", header: "IFR", size: 60, ...renderProps },
      ]
    },
    {
      header: "Pilot Function Time", columns: [
        { accessorKey: "time.pic_time", header: "PIC", size: 50, ...renderProps },
        { accessorKey: "time.co_pilot_time", header: "COP", size: 50, ...renderProps },
        { accessorKey: "time.dual_time", header: "Dual", size: 50, ...renderProps },
        { accessorKey: "time.instructor_time", header: "Instr", size: 50, ...renderProps },
      ]
    },
    {
      header: "FSTD Session", columns: [
        { accessorKey: "sim.type", header: "Type", size: 70, ...renderProps },
        { accessorKey: "sim.time", header: "Time", size: 50, ...renderProps },
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
      <DataTable
        tableName="logbook"
        columns={columns}
        data={data}
        isLoading={isLoading}
        tableProps={{ enableSorting: false, enableColumnActions: false }}
      // renderRowActions={renderRowActions}
      // customComponents={customComponents}
      />
    </>
  );
}

export default Logbook;