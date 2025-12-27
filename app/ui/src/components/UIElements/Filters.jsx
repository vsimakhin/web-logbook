import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import { useLocalStorageState } from "@toolpad/core/useLocalStorageState";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
// MUI Icons
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// Custom
import DatePicker from "./DatePicker";
import AircraftReg from "./AircraftReg";
import AircraftType from "./AircraftType";
import AircraftCategories from "./AircraftCategories";
import TextField from "./TextField";
import Select from "./Select";
import { tableJSONCodec } from "../../constants/constants";
import { fetchAircraftModelsCategories, fetchAircrafts } from "../../util/http/aircraft";
import FlightTags from "./FlightTags";

const MAP_FILTER_INITIAL_STATE = {
  start_date: dayjs().startOf('year'),
  end_date: dayjs().endOf('year'),
  aircraft_reg: "",
  aircraft_model: "",
  aircraft_category: "",
  tags: "",
  place: "",
  routes: true,
  tracks: false,
  show: {},
};

const STATS_FILTERS = [
  { id: 'total_time', label: 'Total Time' },
  { id: 'se_time', label: 'SE Time' },
  { id: 'me_time', label: 'ME Time' },
  { id: 'mcc_time', label: 'MCC Time' },
  { id: 'night_time', label: 'Night Time' },
  { id: 'ifr_time', label: 'IFR Time' },
  { id: 'pic_time', label: 'PIC Time' },
  { id: 'co_pilot_time', label: 'Co-Pilot Time' },
  { id: 'dual_time', label: 'Dual Time' },
  { id: 'instructor_time', label: 'Instructor Time' },
  { id: 'cc_time', label: 'Cross-Country Time' },
  { id: 'sim_time', label: 'Simulator Time' },
];

const getModelsByCategory = (modelsData, category) => {
  if (!category || !modelsData) return [];
  return modelsData
    .filter(item => item.category.split(',').map(c => c.trim()).includes(category))
    .map(item => item.model);
};

const getAircraftsByCategory = (aircrafts, category) => {
  if (!category || !aircrafts) return [];
  return aircrafts
    .filter(item => item.category.split(',').map(c => c.trim()).includes(category))
    .map(item => item.reg);
}

const filterData = (data, filter, modelsData, aircrafts) => {
  filter.start_date = dayjs(filter.start_date, 'DD/MM/YYYY')
  filter.end_date = dayjs(filter.end_date, 'DD/MM/YYYY');

  // Filter data
  const filteredData = data.filter((flight) => {
    // filter by date
    const flightDate = dayjs(flight.date, 'DD/MM/YYYY');
    const matchesDate = flightDate.isBetween(filter.start_date, filter.end_date, null, '[]');
    // filter registration
    const matchesReg = filter.aircraft_reg ? flight.aircraft.reg_name === filter.aircraft_reg : true;
    // filter type
    const matchesType = filter.aircraft_model ? flight.aircraft.model === filter.aircraft_model || flight.sim.type === filter.aircraft_model : true;
    // filter category
    const matchesCategory = (() => {
      if (!filter.aircraft_category) return true;
      const acs = getAircraftsByCategory(aircrafts, filter.aircraft_category)
      const models = getModelsByCategory(modelsData, filter.aircraft_category);
      return (
        acs.includes(flight.aircraft.reg_name) ||
        models.includes(flight.aircraft.model) ||
        models.includes(flight.sim.type) ||
        filter.aircraft_category === flight.sim.type
      );
    })();
    // filter tags
    const matchesTags = filter.tags ? flight.tags.includes(filter.tags) : true;
    // filter arrival and departure place
    const matchesArrival = filter.place ? flight.arrival.place.toUpperCase().includes(filter.place.toUpperCase()) : true;
    const matchesDeparture = filter.place ? flight.departure.place.toUpperCase().includes(filter.place.toUpperCase()) : true;

    return matchesDate & matchesReg && matchesType && matchesCategory && matchesTags && (matchesArrival || matchesDeparture);
  });

  return filteredData;
}

const dateRanges = [
  { label: 'Last 7 days', fn: () => ({ start: dayjs().subtract(7, 'day'), end: dayjs() }) },
  { label: 'Last 30 days', fn: () => ({ start: dayjs().subtract(30, 'day'), end: dayjs() }) },
  { label: 'Last 90 days', fn: () => ({ start: dayjs().subtract(90, 'day'), end: dayjs() }) },
  { label: 'This Month', fn: () => ({ start: dayjs().startOf('month'), end: dayjs().endOf('month') }) },
  { label: 'Last Month', fn: () => ({ start: dayjs().subtract(1, 'month').startOf('month'), end: dayjs().subtract(1, 'month').endOf('month') }) },
  { label: 'Last 3 Months', fn: () => ({ start: dayjs().subtract(3, 'month').startOf('month'), end: dayjs().endOf('month') }) },
  { label: `This Year - ${dayjs().year()}`, fn: () => ({ start: dayjs().startOf('year'), end: dayjs().endOf('year') }) },
  { label: `Last Year - ${dayjs().subtract(1, 'year').year()}`, fn: () => ({ start: dayjs().subtract(1, 'year').startOf('year'), end: dayjs().subtract(1, 'year').endOf('year') }) },
  { label: `Year - ${dayjs().subtract(2, 'year').year()}`, fn: () => ({ start: dayjs().subtract(2, 'year').startOf('year'), end: dayjs().subtract(2, 'year').endOf('year') }) },
  { label: 'All Time', fn: () => ({ start: dayjs('17/12/1903', 'DD/MM/YYYY'), end: dayjs() }) }
];

const defaultOptions = {
  defaultQuickSelect: "This Year",
  showMapSelectors: true,
  showStatsFilters: false,
}

export const Filters = ({ data, callbackFunction, options = defaultOptions }) => {
  const navigate = useNavigate();
  const [filterStatsState, setFilterStatsState] = useLocalStorageState("filter-stats-state", {}, { codec: tableJSONCodec });
  const [filter, setFilter] = useState({ ...MAP_FILTER_INITIAL_STATE, show: filterStatsState });

  const { data: modelsData } = useQuery({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

  const { data: aircrafts } = useQuery({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
  })

  const handleChange = useCallback((key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }, []);

  const handleStatsStateChange = useCallback((key, value) => {
    setFilterStatsState(prev => ({ ...prev, [key]: value }));
    setFilter(prev => ({ ...prev, show: { ...prev.show, [key]: value } }));
  }, [setFilterStatsState]);

  const handleQuickSelect = useCallback((_, value) => {
    const range = dateRanges.find(r => r.label === value);
    if (range) {
      const { start, end } = range.fn();
      setFilter(prev => ({ ...prev, 'start_date': start, 'end_date': end }));
    }
  }, []);

  useEffect(() => {
    if (!data) return;

    const filteredData = filterData(data, filter, modelsData, aircrafts);
    callbackFunction(filteredData, filter);
  }, [data, filter, modelsData, aircrafts, callbackFunction]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleQuickSelect(null, options.defaultQuickSelect)
  }, [handleQuickSelect, options.defaultQuickSelect]);

  return (
    <Grid container spacing={1}>
      <Select gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        label="Quick Date Range"
        onChange={handleQuickSelect}
        defaultValue={options.defaultQuickSelect}
        options={dateRanges.map((range) => (range.label))}
      />
      <DatePicker
        gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
        id="start_date"
        label="Start Date"
        handleChange={handleChange}
        value={filter?.start_date ? dayjs(filter?.start_date, "DD/MM/YYYY") : null}
        tooltip="Start Date"
      />
      <DatePicker
        gsize={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
        id="end_date"
        label="End Date"
        handleChange={handleChange}
        value={filter?.end_date ? dayjs(filter?.end_date, "DD/MM/YYYY") : null}
        tooltip="End Date"
      />
      <AircraftReg
        gsize={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}
        id="aircraft_reg"
        handleChange={handleChange}
        value={filter?.aircraft_reg}
        last={false} disableClearable={false}
      />
      <AircraftType
        gsize={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}
        id="aircraft_model"
        handleChange={handleChange}
        value={filter?.aircraft_model}
        disableClearable={false}
      />
      <AircraftCategories
        gsize={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}
        id="aircraft_category"
        multiple={false}
        handleChange={handleChange}
        value={filter.aircraft_category}
        disableClearable={false}
        options="all"
      />
      <FlightTags
        gsize={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}
        id="tags"
        handleChange={handleChange}
        value={filter.tags}
        multiple={false}
        disableClearable={false}
      />
      <TextField
        gsize={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}
        id="place"
        label="Departure/Arrival"
        handleChange={handleChange}
        tooltip="Departure/Arrival"
        value={filter?.place}
      />
      {options.showMapSelectors &&
        <>
          <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <FormControlLabel label="Route Lines" sx={{ width: '100%' }}
              control={
                <Switch checked={filter?.routes ?? false} onChange={(event) => handleChange("routes", event.target.checked)} />
              }
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
            <FormControlLabel label="Tracks" sx={{ width: '100%' }}
              control={
                <Switch checked={filter?.tracks ?? false} onChange={(event) => handleChange("tracks", event.target.checked)} />
              }
            />
          </Grid>
        </>
      }
      {options.showStatsFilters &&
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <Accordion variant="outlined" sx={{ width: '100%' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Stats Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {STATS_FILTERS.map(({ id, label }) => (
                <FormControlLabel key={id} label={`Show ${label}`} id={id} sx={{ width: '100%' }}
                  control={
                    <Switch
                      checked={filterStatsState[id] ?? true}
                      onChange={(event) => handleStatsStateChange(id, event.target.checked)}
                    />
                  }
                />
              ))}
            </AccordionDetails>
          </Accordion>
        </Grid>
      }
    </Grid >
  );
}

export default Filters;