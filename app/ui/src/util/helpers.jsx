import dayjs from "dayjs";

// Convert minutes to HHHH:MM format
export const convertMinutesToTime = (minutes) => {
  if (!minutes) return "00:00";

  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

// Convert HHHH:MM format back to minutes if needed
export const convertTimeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};

export const getValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

// custom filter function for date range
export const dateFilterFn = (row, columnId, filterValue) => {

  const rowDate = dayjs(getValue(row.original, columnId), "DD/MM/YYYY");
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

const TIME_FIELDS = [
  'se_time', 'me_time', 'mcc_time', 'total_time', 'night_time',
  'ifr_time', 'pic_time', 'co_pilot_time', 'dual_time',
  'instructor_time', 'cc_time'
];

// Helper function to create initial totals object
const createInitialTotals = (additionalFields = {}) => ({
  time: Object.fromEntries(TIME_FIELDS.map(field => [field, 0])),
  landings: { day: 0, night: 0 },
  sim: { time: 0 },
  distance: 0,
  ...additionalFields
});

// Helper function to update totals
const updateTotals = (totals, flight) => {
  const { time, landings, sim, distance } = flight;

  TIME_FIELDS.forEach(field => {
    totals.time[field] += convertTimeToMinutes(time[field]);
  });

  totals.landings.day += parseInt(landings.day) || 0;
  totals.landings.night += parseInt(landings.night) || 0;
  totals.sim.time += convertTimeToMinutes(sim.time);
  totals.distance += parseFloat(distance) || 0;

  return totals;
};

// Helper function to format time totals
const formatTimeTotals = (totals) => ({
  time: Object.fromEntries(
    TIME_FIELDS.map(field => [field, convertMinutesToTime(totals.time[field])])
  ),
  landings: totals.landings,
  sim: { time: convertMinutesToTime(totals.sim.time) },
  distance: totals.distance
});

export const getStats = (data) => {
  const sets = {
    airports: new Set(),
    routes: new Set(),
    aircraftRegs: new Set(),
    aircraftModels: new Set(),
  };

  const periods = {
    totals: createInitialTotals(),
    last28Days: createInitialTotals(),
    last90Days: createInitialTotals(),
    last12Months: createInitialTotals(),
    thisYear: createInitialTotals(),
  };

  const today = dayjs();
  const startDates = {
    last28Days: today.subtract(28, "day"),
    last90Days: today.subtract(90, "day"),
    last12Months: today.subtract(12, "month"),
    thisYear: today.startOf("year"),
  };

  data.forEach((flight) => {
    const { departure, arrival, aircraft, date } = flight;
    const flightDate = dayjs(date, "DD/MM/YYYY");

    // Update sets
    if (departure.place) sets.airports.add(departure.place);
    if (arrival.place) sets.airports.add(arrival.place);
    if (aircraft.reg_name) sets.aircraftRegs.add(aircraft.reg_name);
    if (aircraft.model) sets.aircraftModels.add(aircraft.model);
    if (departure.place && arrival.place) {
      sets.routes.add(`${departure.place}-${arrival.place}`);
    }

    // Update totals
    updateTotals(periods.totals, flight);

    // Update time-based limits dynamically
    Object.entries(startDates).forEach(([key, startDate]) => {
      if (flightDate.isAfter(startDate)) {
        updateTotals(periods[key], flight);
      }
    });
  });

  return {
    ...Object.fromEntries(
      Object.entries(sets).map(([key, set]) => [key, set.size])
    ),
    totals: formatTimeTotals(periods.totals),
    limits: Object.fromEntries(
      Object.entries(periods)
        .filter(([key]) => key !== "totals") // Exclude overall totals
        .map(([key, period]) => [key, convertMinutesToTime(period.time.total_time)])
    ),
  };
};

export const getTotalsByMonthAndYear = (flights) => {
  const totals = flights.reduce((acc, flight) => {
    const [, month, year] = flight.date.split('/');
    const key = `${year}-${month}`;

    if (!acc[key]) {
      acc[key] = createInitialTotals({ year, month });
    }

    updateTotals(acc[key], flight);
    return acc;
  }, {});

  return Object.values(totals).sort((a, b) =>
    a.year === b.year ? a.month - b.month : b.year - a.year
  );
};

export const getTotalsByAircraft = (flights, type, models) => {
  const modelCategories = type === "category" ?
    models.reduce((acc, { model, category }) => {
      acc[model] = category.split(',').map(c => c.trim());
      return acc;
    }, {}) : {};

  const totals = flights.reduce((acc, flight) => {
    const aircraftType = flight.aircraft.model || "Simulator";
    const keys = type === "category" ?
      (modelCategories[aircraftType] ?? [aircraftType]) :
      [aircraftType];

    keys.forEach(key => {
      if (!acc[key]) {
        acc[key] = createInitialTotals({ model: key });
      }
      updateTotals(acc[key], flight);
    });

    return acc;
  }, {});

  return Object.values(totals).sort((a, b) =>
    a.model.localeCompare(b.model)
  );
};