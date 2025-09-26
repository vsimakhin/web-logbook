import dayjs from "dayjs";
import { convertHoursToTime } from "../../util/helpers";
import useSettings from "../../hooks/useSettings";

export const metricOptions = () => {
  const { fieldNameF } = useSettings();

  return [
    { value: "time.total_time", label: fieldNameF("total") },
    { value: "time.se_time", label: fieldNameF("se") },
    { value: "time.me_time", label: fieldNameF("me") },
    { value: "time.mcc_time", label: fieldNameF("mcc") },
    { value: "time.night_time", label: fieldNameF("night") },
    { value: "time.ifr_time", label: fieldNameF("ifr") },
    { value: "time.pic_time", label: fieldNameF("pic") },
    { value: "time.co_pilot_time", label: fieldNameF("cop") },
    { value: "time.dual_time", label: fieldNameF("dual") },
    { value: "time.instructor_time", label: fieldNameF("instr") },
    { value: "landings.all", label: fieldNameF("landings") },
    { value: "landings.day", label: `${fieldNameF("land_day")} ${fieldNameF("landings")}` },
    { value: "landings.night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
    { value: "sim.time", label: `${fieldNameF("fstd")} ${fieldNameF("sim_time")}` },
  ]
};

export const comparisonOptions = [">=", ">", "=", "<", "<="];

export const timeframeUnitOptions = [
  { value: "days", label: "Days" },
  { value: "calendar_months", label: "Calendar Months" },
  { value: "calendar_years", label: "Calendar Years" },
  { value: "since", label: "Since Date" },
  { value: "all_time", label: "All Time" },
];

const getStartDate = (rule) => {
  const { unit, value, since } = rule.time_frame;

  const now = dayjs();
  switch (unit) {
    case "calendar_months":
      const target = now.subtract(value, "month");
      return target.startOf("month");
    case "calendar_years":
      const targetYear = now.year() - (value - 1);
      return dayjs(`${targetYear}-01-01`);
    case "since":
      return dayjs(since, "DD/MM/YYYY");
    case "all_time":
      return dayjs('17/12/1903', 'DD/MM/YYYY');
    case "days":
    default:
      return now.subtract(value, "day");
  }
};

const parseMetricValue = (value) => {
  if (typeof value === "string" && value.includes(":")) {
    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours + minutes / 60;
  }
  return parseFloat(value) || 0;
};

const getModelsByCategory = (modelsData, category) => {
  if (!category || !modelsData) return [];
  return modelsData
    .filter(item => item.category.split(',').map(c => c.trim()).includes(category))
    .map(item => item.model);
};

const resolveModelsFromFilters = (filters, modelsData) => {
  const categories = filters.split(',').map(c => c.trim());
  const models = new Set();
  categories.forEach(cat => {
    getModelsByCategory(modelsData, cat).forEach(model => models.add(model));
  });
  return Array.from(models);
};

const compareValues = (leftValue, operator, rightValue) => {
  const rightNum = Number(rightValue);

  switch (operator) {
    case '>=': return leftValue >= rightNum;
    case '>': return leftValue > rightNum;
    case '=': return leftValue === rightNum;
    case '<': return leftValue < rightNum;
    case '<=': return leftValue <= rightNum;
    default: return false;
  }
};

export const evaluateCurrency = (flights, rule, modelsData) => {
  if (!flights || flights.length === 0) return null;
  const models = resolveModelsFromFilters(rule.filters, modelsData);

  const filteredFlights = flights.filter(flight => {
    const matchesModel = models.length === 0 || models.includes(flight.aircraft.model);
    return matchesModel;
  });

  const since = getStartDate(rule);

  const total = filteredFlights
    .filter(flight => {
      const flightDate = dayjs(flight.date, "DD/MM/YYYY");
      if (!flightDate.isValid() || flightDate.isBefore(since)) return false;
      return true;
    })
    .reduce((sum, flight) => {
      let value;
      if (rule.metric === "landings.all") {
        const day = parseMetricValue(flight.landings?.day);
        const night = parseMetricValue(flight.landings?.night);
        value = day + night;
      } else {
        value = rule.metric.split('.').reduce((obj, k) => obj?.[k], flight);
        value = parseMetricValue(value);
      }
      return sum + value;
    }, 0);

  const result = {
    current: total,
    meetsRequirement: compareValues(total, rule.comparison, rule.target_value),
    rule: rule,
  };

  return result;
};

export const formatCurrencyValue = (value, metric) => {
  if (!metric) return value;

  if (metric.includes('landings')) {
    return value;
  } else if (metric.includes('time')) {
    return convertHoursToTime(value);
  } else {
    return value;
  }
};