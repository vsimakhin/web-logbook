import { Link } from "react-router-dom";
import dayjs from "dayjs";
// MUI
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
// MUI Icons
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
// Custom
import { convertMinutesToTime, convertTimeToMinutes, getValue } from "../../util/helpers";
import { Badge, Checkbox, FormControlLabel, Tooltip } from "@mui/material";
import CustomMinMaxFilter from "../UIElements/CustomMinMaxFilter";

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
  filterFn: customMinMaxFilterFn,
  filterVariant: "landing",
  Filter: ({ column }) => <CustomMinMaxFilter column={column} label={`Landings ${name}`} />,
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

export const createHasTrackColumn = (id, size) => ({
  accessorKey: id,
  header:
    <Tooltip title="Shows an icon if a flight record has a track attached">
      <MapOutlinedIcon />
    </Tooltip>,
  size: size,
  ...renderProps,
  Cell: ({ cell }) => (cell.getValue() ? <MapOutlinedIcon /> : ""),
  filterFn: (row, columnId, filterValue) => {
    if (filterValue === null) return true; // show all
    return !!row.getValue(columnId) === filterValue;
  },
  filterVariant: "has-track",
  Filter: ({ column }) => {
    let value = column.getFilterValue();
    if (value === undefined) value = null;
    // value: true = has track, false = no track, null = all
    return (
      <FormControlLabel sx={{ m: 0, p: 0 }}
        control={
          <Checkbox
            checked={value === true}
            indeterminate={value == null}
            onChange={e => {
              // cycle between true -> false -> null
              if (value === null) column.setFilterValue(true);
              else if (value === true) column.setFilterValue(false);
              else column.setFilterValue(null);
            }}
          />
        }
        labelPlacement="start"
        label={
          <Typography variant="caption" color="text.secondary">
            Filter by having track
          </Typography>
        }
      />
    );
  },
})

export const createAttachmentColumn = (id, size) => ({
  accessorKey: id,
  header:
    <Tooltip title="Shows an icon with a badge indicating the number of attachments">
      <AttachFileOutlinedIcon />
    </Tooltip>,
  size: size,
  ...renderProps,
  Cell: ({ cell }) => (
    cell.getValue() ? <Badge badgeContent={cell.getValue()}><AttachFileOutlinedIcon color="action" /></Badge> : ""
  ),
  filterFn: customMinMaxFilterFn,
  filterVariant: "attachments",
  Filter: ({ column }) => <CustomMinMaxFilter column={column} label="Attachments" />,
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

export const createCustomFieldColumnGroup = (customFields) => {
  if (!customFields || !Array.isArray(customFields)) {
    return [];
  }

  if (!customFields.some(field => field.category === "Custom")) {
    return [];
  }

  return [{
    header: "Custom",
    columns: [
      ...createCustomFieldColumns(customFields, "Custom")
    ]
  }]
}

export const getFilterLabel = (column, fieldName) => {

  const id = column.columnDef.id;
  const header = column.columnDef.header;

  const fieldNames = {
    "date": fieldName("date"),
    "time.se_time": fieldName("se"),
    "time.me_time": fieldName("me"),
    "time.mcc_time": fieldName("mcc"),
    "time.total_time": fieldName("total"),
    "time.night_time": fieldName("night"),
    "time.ifr_time": fieldName("ifr"),
    "time.pic_time": fieldName("pic"),
    "time.co_pilot_time": fieldName("cop"),
    "time.dual_time": fieldName("dual"),
    "time.instructor_time": fieldName("instr"),
    "landings.day": fieldName("land_day"),
    "landings.night": fieldName("land_night"),
    "sim.time": `${fieldName("fstd")} ${fieldName("sim_time")}`,
  };

  const field = fieldNames[id] || header;

  return {
    label: `Filter by ${field}`,
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

export const customMinMaxFilterFn = (row, columnId, filterValue) => {
  const rowValue = parseInt(getValue(row.original, columnId)) || 0;
  const [min, max] = filterValue || ["", ""];

  if (!min && !max) return true;

  const isAfterMin = min !== "" ? rowValue >= min : true;
  const isBeforeMax = max !== "" ? rowValue <= max : true;

  return isAfterMin && isBeforeMax;
}