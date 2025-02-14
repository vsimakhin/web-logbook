import dayjs from "dayjs";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
// Custom
import DatePicker from "../UIElements/DatePicker";
import AircraftReg from "../UIElements/AircraftReg";
import AircraftType from "../UIElements/AircraftType";
import AircraftCategories from "../UIElements/AircraftCategories";
import TextField from "../UIElements/TextField";
import Select from "../UIElements/Select";

const dateRanges = [
  {
    label: 'Last 7 days',
    fn: () => ({ start: dayjs().subtract(7, 'day'), end: dayjs() })
  },
  {
    label: 'Last 30 days',
    fn: () => ({ start: dayjs().subtract(30, 'day'), end: dayjs() })
  },
  {
    label: 'Last 90 days',
    fn: () => ({ start: dayjs().subtract(90, 'day'), end: dayjs() })
  },
  {
    label: 'This Month',
    fn: () => ({ start: dayjs().startOf('month'), end: dayjs().endOf('month') })
  },
  {
    label: 'Last Month',
    fn: () => ({ start: dayjs().subtract(1, 'month').startOf('month'), end: dayjs().subtract(1, 'month').endOf('month') })
  },
  {
    label: 'Last 3 Months',
    fn: () => ({ start: dayjs().subtract(3, 'month').startOf('month'), end: dayjs().endOf('month') })
  },
  {
    label: 'This Year',
    fn: () => ({ start: dayjs().startOf('year'), end: dayjs().endOf('year') })
  },
  {
    label: 'Last Year',
    fn: () => ({ start: dayjs().subtract(1, 'year').startOf('year'), end: dayjs().subtract(1, 'year').endOf('year') })
  },
];

export const Filters = ({ filter, handleChange }) => {
  const handleQuickSelect = (_, value) => {
    const range = dateRanges.find(r => r.label === value);
    if (range) {
      const { start, end } = range.fn();
      handleChange('start_date', start);
      handleChange('end_date', end);
    }
  };

  return (
    <>
      <Grid container spacing={1}>
        <Select gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          label="Quick Date Range"
          onChange={handleQuickSelect}
          defaultValue="This Year"
          options={dateRanges.map((range) => (range.label))}
        />
        <DatePicker
          gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="start_date"
          label="Start Date"
          handleChange={handleChange}
          value={filter?.start_date ? dayjs(filter?.start_date, "DD/MM/YYYY") : null}
          tooltip="Start Date"
        />
        <DatePicker
          gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="end_date"
          label="End Date"
          handleChange={handleChange}
          value={filter?.end_date ? dayjs(filter?.end_date, "DD/MM/YYYY") : null}
          tooltip="End Date"
        />
        <AircraftReg
          gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="aircraft_reg"
          handleChange={handleChange}
          value={filter?.aircraft_reg}
          last={false} disableClearable={false}
        />
        <AircraftType
          gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="aircraft_model"
          handleChange={handleChange}
          value={filter?.aircraft_model}
          disableClearable={false}
        />
        <AircraftCategories
          gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="aircraft_category"
          multiple={false}
          handleChange={handleChange}
          value={filter.aircraft_category}
          disableClearable={false}
        />
        <TextField
          gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="place"
          label="Departure/Arrival"
          handleChange={handleChange}
          tooltip="Departure/Arrival"
          value={filter?.place}
        />
        <FormControlLabel
          control={
            <Switch
              checked={filter?.no_routes ?? false}
              onChange={(event) => handleChange("no_routes", event.target.checked)}
            />
          }
          label="No Route Lines"
        />
      </Grid>
    </>
  );
}

export default Filters;