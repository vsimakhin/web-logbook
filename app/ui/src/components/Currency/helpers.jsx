import dayjs from "dayjs";
import { convertHoursToTime } from "../../util/helpers";

export const metricOptions = [
  { value: "time.total_time", label: "Total Time" },
  { value: "time.se_time", label: "SE Time" },
  { value: "time.me_time", label: "ME Time" },
  { value: "time.mcc_time", label: "MCC Time" },
  { value: "time.night_time", label: "Night Time" },
  { value: "time.ifr_time", label: "IFR Time" },
  { value: "time.pic_time", label: "PIC Time" },
  { value: "time.co_pilot_time", label: "Co-Pilot Time" },
  { value: "time.dual_time", label: "Dual Time" },
  { value: "time.instructor_time", label: "Instructor Time" },
  { value: "landings.all", label: "Total Landings" },
  { value: "landings.day", label: "Day Landings" },
  { value: "landings.night", label: "Night Landings" },
  { value: "sim.time", label: "Sim Time" },
]

export const comparisonOptions = [">=", ">", "=", "<", "<="];

export const timeframeUnitOptions = [
  { value: "days", label: "Days" },
  { value: "calendar_months", label: "Calendar Months" },
  { value: "calendar_years", label: "Calendar Years" },
];

const getStartDate = (unit, value) => {
  const now = dayjs();
  switch (unit) {
    case "calendar_months":
      const target = now.subtract(value, "month");
      return target.startOf("month");
    case "calendar_years":
      const targetYear = now.year() - (value - 1);
      return dayjs(`${targetYear}-01-01`);
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

  const since = getStartDate(rule.time_frame.unit, rule.time_frame.value);

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