import dayjs from "dayjs";
// MUI
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const renderTextProps = {
  muiTableBodyCellProps: { align: "left", sx: { p: 0.5 } },
  muiTableHeadCellProps: { align: "center" },
  muiTableFooterCellProps: { align: "center", sx: { p: 0.5 } }
};

export const renderProps = {
  muiTableBodyCellProps: { align: "center", sx: { p: 0.5 } },
  muiTableHeadCellProps: { align: "center" },
  muiTableFooterCellProps: { align: "center", sx: { p: 0.5 } }
};

export const timeFieldSize = 60;

// Convert minutes to HHHH:MM format
const convertMinutesToTime = (minutes) => {
  if (!minutes) return "00:00";

  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

// Convert HHHH:MM format back to minutes if needed
const convertTimeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};

const getValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

export const renderTotalFooter = () => {
  return (
    <Stack direction="column" spacing={1} >
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>Page:</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>Total:</Typography>
    </Stack>
  );
};

const renderTimeFooter = (table, field) => {
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) => total + convertTimeToMinutes(getValue(row.original, field)), 0);
  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) => total + convertTimeToMinutes(getValue(row.original, field)), 0);

  return (
    <Stack direction="column" spacing={1} alignItems="center" >
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{convertMinutesToTime(totalForCurrentPage)}</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{convertMinutesToTime(totalForAllData)}</Typography>
    </Stack>
  );
};

const renderLangingFooter = (table, field) => {
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) => total + getValue(row.original, field), 0);
  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) => total + getValue(row.original, field), 0);

  return (
    <Stack direction="column" spacing={1} alignItems="center">
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{totalForCurrentPage}</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{totalForAllData}</Typography>
    </Stack>
  );
};

export const renderHeader = (header) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {header.map((item, key) => (<Typography key={key} color="textPrimary" sx={{ fontWeight: 'bold' }}>{item}</Typography>))}
    </Box>
  );
}

export const createTimeColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: timeFieldSize,
  ...renderProps,
  filterVariant: "time-range", filterFn: "timeFilterFn",
  muiFilterTimePickerProps: { ampm: false },
  Footer: ({ table }) => renderTimeFooter(table, id),
})

export const createLandingColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: 53,
  ...renderProps,
  Cell: ({ cell }) => (cell.getValue() === 0 ? "" : cell.getValue()),
  Footer: ({ table }) => renderLangingFooter(table, id),
})

export const createDateColumn = (id, name, size) => ({
  accessorKey: id,
  header: name,
  size: size,
  ...renderTextProps,
  filterVariant: "date-range", filterFn: "dateFilterFn",
  muiFilterDatePickerProps: { format: "DD/MM/YYYY" },
})

export const createColumn = (id, name, size, isText = false, footer = undefined) => ({
  accessorKey: id,
  header: name,
  size: size,
  ...(isText ? renderTextProps : renderProps),
  Footer: () => footer,
})

export const getFilterLabel = (column) => {
  const id = column.columnDef.id;
  const header = column.columnDef.header;

  const fieldNames = {
    "date": "Date",
    "departure.place": "Departure Place",
    "departure.time": "Departure Time",
    "arrival.place": "Arrival Place",
    "arrival.time": "Arrival Time",
    "aircraft.model": "Aircraft Type",
    "aircraft.reg_name": "Aircraft Reg",
    "time.total_time": "Total Time",
    "pic_name": "PIC",
    "remarks": "Remarks"
  };

  let fieldName = fieldNames[id] || header;

  if (id.includes("landings.")) {
    fieldName = `${header} Landing`;
  } else if (id.includes("sim.")) {
    fieldName = `Sim ${header}`;
  } else if (id.includes("time.")) {
    fieldName = `${header} Time`;
  }

  return { label: `Filter by ${fieldName}` };
};

// custom filter function for date range
export const dateFilterFn = (row, columnId, filterValue) => {

  const rowDate = dayjs(row.original.date, "DD/MM/YYYY");
  const [startDate, endDate] = filterValue || [];

  // If no filter is applied, return true
  if (!startDate && !endDate) return true;

  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime() : null; // Include the end of the day

  // Check if the row date is within the selected range
  const isAfterStart = start !== null ? rowDate >= start : true;
  const isBeforeEnd = end !== null ? rowDate <= end : true;

  return isAfterStart && isBeforeEnd;
};

// custom filter function for time range
export const timeFilterFn = (row, columnId, filterValue) => {
  const rowValue = getValue(row.original, columnId);
  const [min, max] = filterValue || [];

  // If no filter is applied, return true
  if (!min && !max) return true;
  if (rowValue === "" || rowValue === null || rowValue === undefined) return false;

  const rowTime = dayjs(rowValue, "HH:mm");
  console.log(rowTime, min, max);

  const isAfterMin = min !== undefined ? rowTime >= min : true;
  const isBeforeMax = max !== undefined ? rowTime <= max : true;

  return isAfterMin && isBeforeMax;
}
