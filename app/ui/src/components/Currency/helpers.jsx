import dayjs from "dayjs";
import { convertHoursToTime } from "../../util/helpers";

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

const resolveAircraftsFromFilters = (filters, aircrafts = []) => {
  if (!filters) return new Set();

  const categories = filters.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
  const regs = new Set();

  for (const ac of aircrafts) {
    const acCats = ac.category.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);

    for (const cat of categories) {
      if (acCats.includes(cat)) {
        regs.add(ac.reg);
        break;
      }
    }
  }

  return regs;
};

export const evaluateCurrency = (flights, rule, aircrafts) => {
  if (!flights || flights.length === 0) return null;
  const regs = resolveAircraftsFromFilters(rule.filters, aircrafts)

  const filteredFlights = flights.filter(flight => {
    return regs.size === 0 || regs.has(flight.aircraft.reg_name);
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

// Compute expiry date for landing-based rules.
// Respects model/category filters via resolveModelsFromFilters.
// Supported metrics:
// - landings.all → day + night
// - landings.day → day landings only
// - landings.night → night landings only
// Expiry rule: 90 days after the 3rd most recent qualifying landing.
export const getCurrencyExpiryForRule = (flights, rule, aircrafts) => {
  if (!flights || flights.length === 0 || !rule?.metric) return null;

  // const models = resolveModelsFromFilters(rule.filters || '', modelsData);
  // const filteredFlights = flights.filter(f => models.length === 0 || models.includes(f.aircraft.model));
  const regs = resolveAircraftsFromFilters(rule.filters, aircrafts)

  const filteredFlights = flights.filter(flight => {
    return regs.size === 0 || regs.has(flight.aircraft.reg_name);
  });

  // Landings-based: 90 days after the 3rd most recent qualifying landing
  if (rule.metric.startsWith('landings')) {
    const selector = (() => {
      if (rule.metric === 'landings.day') return (f) => parseInt(f?.landings?.day) || 0;
      if (rule.metric === 'landings.night') return (f) => parseInt(f?.landings?.night) || 0;
      return (f) => (parseInt(f?.landings?.day) || 0) + (parseInt(f?.landings?.night) || 0);
    })();

    const events = [];
    filteredFlights.forEach(f => {
      const d = dayjs(f?.date, 'DD/MM/YYYY');
      if (!d.isValid()) return;
      const cnt = Math.max(0, selector(f));
      for (let i = 0; i < cnt; i++) events.push(d);
    });

    if (events.length < 3) return null;
    events.sort((a, b) => b.valueOf() - a.valueOf());
    const third = events[2];
    return third.add(90, 'day');
  }

  // Time-based (e.g., time.pic_time, time.total_time, sim.time):
  // Expiry is the date when the oldest needed flight exits the rolling window (days).
  const unit = rule?.time_frame?.unit;
  const windowDays = unit === 'days' ? Number(rule?.time_frame?.value) : null;
  if (!windowDays || isNaN(windowDays) || windowDays <= 0) return null;

  // Only meaningful for threshold comparisons (>= or >). Others return null.
  const operator = rule?.comparison ?? '>=';
  if (!['>=', '>'].includes(operator)) return null;
  const target = Number(rule?.target_value);
  if (isNaN(target)) return null;

  const today = dayjs().startOf('day');
  const windowStart = today.subtract(windowDays, 'day').add(1, 'day'); // inclusive window [start..today]

  // Collect flights within the window with their metric values
  const metricPath = rule.metric.split('.');
  const flightsInWindow = filteredFlights
    .map(f => ({ f, d: dayjs(f?.date, 'DD/MM/YYYY') }))
    .filter(({ d }) => d.isValid() && !d.isBefore(windowStart) && !d.isAfter(today))
    .map(({ f, d }) => {
      let value = metricPath.reduce((obj, k) => obj?.[k], f);
      const amount = parseMetricValue(value); // hours for time metrics
      return { d, amount };
    })
    .filter(({ amount }) => !isNaN(amount) && amount > 0)
    .sort((a, b) => a.d.valueOf() - b.d.valueOf()); // ascending by date

  // Current sum within the window
  const total = flightsInWindow.reduce((s, x) => s + x.amount, 0);
  const meets = operator === '>=' ? total >= target : total > target;
  if (!meets) {
    // Not current today. Compute the most recent expiry in the past (last time the rule was still valid).
    // Two-pointer sliding window across all flights by date to find any date d where window sum >= target.
    const allFlights = filteredFlights
      .map(f => ({ d: dayjs(f?.date, 'DD/MM/YYYY'), amount: parseMetricValue(metricPath.reduce((obj, k) => obj?.[k], f)) }))
      .filter(x => x.d.isValid() && !isNaN(x.amount) && x.amount > 0)
      .sort((a, b) => a.d.valueOf() - b.d.valueOf());

    let left = 0;
    let sum = 0;
    let lastExpiry = null;
    for (let right = 0; right < allFlights.length; right++) {
      const rightDate = allFlights[right].d;
      sum += allFlights[right].amount;
      // shrink window to [rightDate - windowDays + 1, rightDate]
      while (left <= right && allFlights[left].d.isBefore(rightDate.subtract(windowDays - 1, 'day'))) {
        sum -= allFlights[left].amount;
        left++;
      }
      const isValid = operator === '>=' ? sum >= target : sum > target;
      if (isValid) {
        lastExpiry = rightDate.add(windowDays, 'day');
      }
    }
    return lastExpiry; // may be in the past (desired for "last active until")
  }

  // Find the oldest needed flight: minimal suffix (from newest backwards) whose sum >= target
  let running = 0;
  let expirySource = null;
  for (let i = flightsInWindow.length - 1; i >= 0; i--) {
    running += flightsInWindow[i].amount;
    if ((operator === '>=' && running >= target) || (operator === '>' && running > target)) {
      expirySource = flightsInWindow[i];
      break;
    }
  }
  if (!expirySource) return null;
  return expirySource.d.add(windowDays, 'day');
};