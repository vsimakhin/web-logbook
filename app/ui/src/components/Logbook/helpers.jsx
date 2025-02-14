import { Link } from "react-router-dom";
import dayjs from "dayjs";
// MUI
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
// Custom
import { convertMinutesToTime, convertTimeToMinutes, getValue } from "../../util/helpers";

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
  filterVariant: "number-range", filterFn: "landingFilterFn",
  Cell: ({ cell }) => (cell.getValue() === 0 ? "" : cell.getValue()),
  Footer: ({ table }) => renderLangingFooter(table, id),
})

export const createDateColumn = (id, name, size) => ({
  accessorKey: id,
  header: name,
  Cell: ({ renderedCellValue, row }) => (<Typography variant="body2" color="primary"><Link to={`/logbook/${row.original.uuid}`} style={{ textDecoration: 'none', color: "inherit" }}>{renderedCellValue}</Link></Typography>),
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

  return { label: `Filter by ${fieldName}`, placeholder: '', InputLabelProps: { shrink: true } };
};

// custom filter function for time range
export const timeFilterFn = (row, columnId, filterValue) => {
  const rowValue = getValue(row.original, columnId);
  const [min, max] = filterValue || [];

  // If no filter is applied, return true
  if (!min && !max) return true;
  if (rowValue === "" || rowValue === null || rowValue === undefined) return false;

  const rowTime = dayjs(rowValue, "HH:mm");

  const isAfterMin = min !== undefined ? rowTime >= min : true;
  const isBeforeMax = max !== undefined ? rowTime <= max : true;

  return isAfterMin && isBeforeMax;
}

// custom filter function for landing range
export const landingFilterFn = (row, columnId, filterValue) => {
  const rowValue = parseInt(getValue(row.original, columnId)) || 0;
  const [min, max] = filterValue || [];

  if (!min && !max) return true;

  const isAfterMin = min !== undefined ? rowValue >= min : true;
  const isBeforeMax = max !== undefined ? rowValue <= max : true;

  return isAfterMin && isBeforeMax;
}