import dayjs from "dayjs";

// Convert minutes to HHHH:MM format
export const convertMinutesToTime = (minutes) => {
  if (!minutes) return "00:00";

  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

// Convert hours to HHHH:MM format
export const convertHoursToTime = (hours) => {
  if (!hours) return "00:00";
  const totalMinutes = Math.floor(hours * 60);
  const formattedTime = convertMinutesToTime(totalMinutes);
  return formattedTime;
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

// Helper function to update custom field totals
const updateCustomFieldTotals = (totals, flight, customFields) => {
  if (!flight.custom_fields || !customFields || customFields.length === 0) return;

  customFields.forEach(field => {
    if (field.stats_function === 'none') return;

    const value = flight.custom_fields[field.uuid];
    if (value && value !== '') {
      let numValue = 0;
      if (field.type === 'duration') {
        numValue = convertTimeToMinutes(value);
      } else if (field.type === 'number') {
        numValue = parseFloat(value);
      } else if (field.type === 'text' || field.type === 'time') {
        numValue = 1; // For count functionality
      }

      if (totals.custom_fields && totals.custom_fields[field.uuid]) {
        totals.custom_fields[field.uuid].sum += numValue;
        totals.custom_fields[field.uuid].count += 1;
      }
    }
  });
};

// Helper function to calculate custom field final values based on stats function
export const getCustomFieldValue = (fieldData, field) => {
  if (!fieldData || !field) return 0;

  switch (field.stats_function) {
    case 'sum':
      return field.type === 'duration' ? convertMinutesToTime(fieldData.sum) : fieldData.sum;
    case 'average':
      {
        if (fieldData.count === 0) return 0;
        const average = fieldData.sum / fieldData.count;
        return field.type === 'duration' ? convertMinutesToTime(Math.round(average)) : Number(average.toFixed(2));
      }
    case 'count':
      return fieldData.count;
    default:
      return 0;
  }
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

export const getStats = (data, airportsMap) => {
  const sets = {
    airports: new Set(),
    routes: new Set(),
    aircraftRegs: new Set(),
    aircraftModels: new Set(),
    countries: new Set(),
  };

  const totals = createInitialTotals();

  data.forEach((flight) => {
    const { departure, arrival, aircraft } = flight;

    // Update sets
    if (departure.place) sets.airports.add(departure.place);
    if (arrival.place) sets.airports.add(arrival.place);
    if (aircraft.reg_name) sets.aircraftRegs.add(aircraft.reg_name);
    if (aircraft.model) sets.aircraftModels.add(aircraft.model);
    if (departure.place && arrival.place) {
      sets.routes.add(`${departure.place}-${arrival.place}`);
    }

    if (departure.place && airportsMap) {
      const airport = airportsMap.get(departure.place);
      if (airport) {
        sets.countries.add(airport.country);
      }
    }
    if (arrival.place && airportsMap) {
      const airport = airportsMap.get(arrival.place);
      if (airport) {
        sets.countries.add(airport.country);
      }
    }
    // Update totals
    updateTotals(totals, flight);
  });

  return {
    ...Object.fromEntries(
      Object.entries(sets).map(([key, set]) => [key, set.size])
    ),
    totals: formatTimeTotals(totals),
  };
};

export const getTotalsByMonthAndYear = (flights, customFields = []) => {
  const totals = flights.reduce((acc, flight) => {
    const [, month, year] = flight.date.split('/');
    const key = `${year}-${month}`;

    if (!acc[key]) {
      acc[key] = createInitialTotals({ year, month });
      // Initialize custom fields
      acc[key].custom_fields = {};
      customFields.forEach(field => {
        if (field.stats_function !== 'none') {
          acc[key].custom_fields[field.uuid] = { sum: 0, count: 0 };
        }
      });
    }

    updateTotals(acc[key], flight);
    updateCustomFieldTotals(acc[key], flight, customFields);
    return acc;
  }, {});

  return Object.values(totals).sort((a, b) =>
    a.year === b.year ? a.month - b.month : b.year - a.year
  );
};

export const getTotalsByAircraft = (flights, type, models, aircrafts, customFields) => {
  if (!flights || flights.length === 0) return [];
  if (!customFields) customFields = [];

  const modelCategories = type === "category" ?
    models.reduce((acc, { model, category }) => {
      acc[model] = category.split(',').map(c => c.trim());
      return acc;
    }, {}) : {};

  const aircraftMap = aircrafts?.reduce((acc, a) => {
    acc[a.reg] = a;
    return acc;
  }, {}) ?? {};

  const totals = flights.reduce((acc, flight) => {
    const aircraftType = flight.aircraft.model;
    const aircraftReg = flight.aircraft.reg_name;

    let keys;
    const ac = aircraftMap[aircraftReg];

    if (aircraftType) {
      // Normal case: real aircraft
      if (type === "category") {
        keys = modelCategories[aircraftType] ?? [aircraftType];
        if (ac) {
          const extra = ac.category.split(',').map(c => c.trim()).filter(Boolean);
          keys = [...new Set([...keys, ...extra])];
        }
      } else {
        keys = [aircraftType];
      }
    } else {
      // Simulator case
      const simType = flight.sim?.type;
      if (
        simType &&
        (models.some(m => m.model === simType) ||
          Object.values(modelCategories).some(cats => cats.includes(simType)))
      ) {
        // If simType matches a known model or category
        keys = type === "category"
          ? modelCategories[simType] ?? [simType]
          : [simType];
      } else {
        // Otherwise keep it as "Simulator"
        keys = ["Simulator"];
      }
    }

    keys.forEach(key => {
      if (!acc[key]) {
        acc[key] = createInitialTotals({ model: key });
        // Initialize custom fields
        acc[key].custom_fields = {};
        customFields.forEach(field => {
          if (field.stats_function !== 'none') {
            acc[key].custom_fields[field.uuid] = { sum: 0, count: 0 };
          }
        });
      }
      updateTotals(acc[key], flight);
      updateCustomFieldTotals(acc[key], flight, customFields);
    });

    return acc;
  }, {});

  return Object.values(totals).sort((a, b) =>
    a.model.localeCompare(b.model)
  );
};

export const printPerson = person => {
  if (!person) return '';
  return `${person.first_name} ${person.middle_name} ${person.last_name}`
}