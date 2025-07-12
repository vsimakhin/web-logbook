import { Link } from "react-router-dom";
import dayjs from "dayjs";
// MUI
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
// Custom
import { convertMinutesToTime, convertTimeToMinutes, getValue } from "../../util/helpers";
import { LandingFilter } from "../UIElements/LandingsFilter";

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

const shouldHideTime = (id, row) => {
  return (id === "time.me_time" || id === "time.se_time") &&
    row.original.time.mcc_time !== "";
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
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) =>
    total + (shouldHideTime(field, row) ? 0 : convertTimeToMinutes(getValue(row.original, field))), 0
  );
  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) =>
    total + (shouldHideTime(field, row) ? 0 : convertTimeToMinutes(getValue(row.original, field))), 0
  );

  return (
    <Stack direction="column" spacing={1} alignItems="center" >
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{convertMinutesToTime(totalForCurrentPage)}</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{convertMinutesToTime(totalForAllData)}</Typography>
    </Stack>
  );
};

const renderNumberFooter = (table, field) => {
  const totalForAllData = table.getPreGroupedRowModel().rows.reduce((total, row) => {
    const value = getValue(row.original, field);
    const numValue = value ? parseFloat(value) : 0;
    return total + (isNaN(numValue) ? 0 : numValue);
  }, 0);

  const totalForCurrentPage = table.getRowModel().rows.reduce((total, row) => {
    const value = getValue(row.original, field);
    const numValue = value ? parseFloat(value) : 0;
    return total + (isNaN(numValue) ? 0 : numValue);
  }, 0);

  return (
    <Stack direction="column" spacing={1} alignItems="center">
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{totalForCurrentPage}</Typography>
      <Typography color="textPrimary" sx={{ fontWeight: 'bold' }}>{totalForAllData}</Typography>
    </Stack>
  );
};

export const createTimeColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: timeFieldSize,
  ...renderProps,
  filterVariant: "time-range", filterFn: "timeFilterFn",
  Cell: ({ cell, row }) => {
    if (shouldHideTime(id, row)) {
      return "";
    }
    return cell.getValue();
  },
  muiFilterTimePickerProps: { ampm: false },
  Footer: ({ table }) => renderTimeFooter(table, id),
})

export const createLandingColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: 53,
  ...renderProps,
  filterFn: "landingFilterFn", filterVariant: "landing",
  Filter: ({ column }) => <LandingFilter column={column} />, // using custom filter component, otherwise it just goes crazy
  Cell: ({ cell }) => (cell.getValue() === 0 ? "" : cell.getValue()),
  Footer: ({ table }) => renderNumberFooter(table, id),
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

export const createCustomFieldColumns = (customFields, category) => {
  if (!customFields || !Array.isArray(customFields)) {
    return [];
  }
  return customFields
    .filter(field => field.category === category)
    .map(field => {
      const baseColumn = {
        accessorKey: `custom_fields.${field.uuid}`,
        id: field.uuid,
        header: field.name,
        size: 100,
        ...renderProps,
        accessorFn: (row) => row.custom_fields?.[field.uuid] || '',
        Cell: ({ cell }) => cell.getValue() || '',
      };

      // Add time footer for duration fields
      if (field.type === 'duration') {
        baseColumn.filterVariant = "time-range";
        baseColumn.filterFn = "timeFilterFn";
        baseColumn.Footer = ({ table }) => renderTimeFooter(table, `custom_fields.${field.uuid}`);
      } else if (field.type === 'number') {
        baseColumn.Footer = ({ table }) => renderNumberFooter(table, `custom_fields.${field.uuid}`);
      }

      return baseColumn;
    })
}

export const createCustomFieldColumnGroup = (customFields, category, header) => {
  const fields = createCustomFieldColumns(customFields, category);
  if (fields.length === 0) {
    return null;
  }
  return {
    header: header,
    columns: fields
  };
}

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

  return {
    label: `Filter by ${fieldName}`,
    placeholder: '',
    InputLabelProps: { shrink: true },
  };
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
  const [min, max] = filterValue || ["", ""];

  if (!min && !max) return true;

  const isAfterMin = min !== "" ? rowValue >= min : true;
  const isBeforeMax = max !== "" ? rowValue <= max : true;

  return isAfterMin && isBeforeMax;
}