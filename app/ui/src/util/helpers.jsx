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

// Calculate totals for each field
const calculateTotals = (totals, flight) => {
  const { time, landings, sim } = flight;

  TIME_FIELDS.forEach(field => {
    totals.time[field] += convertTimeToMinutes(time[field]);
  });

  totals.landings.day += parseInt(landings.day) || 0;
  totals.landings.night += parseInt(landings.night) || 0;
  totals.sim.time += convertTimeToMinutes(sim.time);
  totals.distance += parseInt(flight.distance) || 0;
};

export const getStats = (data) => {
  const airports = new Set();
  const routes = new Set();
  const aircraftRegs = new Set();
  const aircraftModels = new Set();

  // totals in munutes
  const totals = {
    time: Object.fromEntries(TIME_FIELDS.map(field => [field, 0])),
    landings: { day: 0, night: 0 },
    sim: { time: 0 },
    distance: 0
  };

  data.forEach(flight => {
    if (flight.departure.place) airports.add(flight.departure.place);
    if (flight.arrival.place) airports.add(flight.arrival.place);
    if (flight.aircraft.reg_name) aircraftRegs.add(flight.aircraft.reg_name);
    if (flight.aircraft.model) aircraftModels.add(flight.aircraft.model);

    if (flight.departure.place && flight.arrival.place) {
      routes.add(`${flight.departure.place}-${flight.arrival.place}`);
    }

    calculateTotals(totals, flight);
  });

  return {
    airports: airports.size,
    routes: routes.size,
    aircraftRegs: aircraftRegs.size,
    aircraftModels: aircraftModels.size,
    totals: {
      time: Object.fromEntries(
        TIME_FIELDS.map(field => [field, convertMinutesToTime(totals.time[field])])
      ),
      landings: totals.landings,
      sim: { time: convertMinutesToTime(totals.sim.time) },
      distance: totals.distance
    }
  };
};

export const getTotalsByMonthAndYear = (flights) => {
  const totalsByMonthYear = {};

  flights.forEach(flight => {
    const { date, time, landings, sim, distance } = flight;
    const [day, month, year] = date.split('/'); // Assuming format 'DD/MM/YYYY'
    const key = `${year}-${month}`; // Format: YYYY-MM

    if (!totalsByMonthYear[key]) {
      totalsByMonthYear[key] = {
        year: year,
        month: month,
        time: Object.fromEntries(TIME_FIELDS.map(field => [field, 0])),
        landings: { day: 0, night: 0 },
        sim: { time: 0 },
        distance: 0
      };
    }

    TIME_FIELDS.forEach(field => {
      totalsByMonthYear[key].time[field] += convertTimeToMinutes(time[field]);
    });

    totalsByMonthYear[key].landings.day += parseInt(landings.day) || 0;
    totalsByMonthYear[key].landings.night += parseInt(landings.night) || 0;
    totalsByMonthYear[key].sim.time += convertTimeToMinutes(sim.time);
    totalsByMonthYear[key].distance += parseInt(distance) || 0;
  });

  // return array of objects in descending order
  return Object.values(totalsByMonthYear).sort((a, b) => {
    if (a.year === b.year) {
      return a.month - b.month;
    }
    return b.year - a.year;
  });
};