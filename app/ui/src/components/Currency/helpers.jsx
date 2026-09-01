import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { convertHoursToTime } from "../../util/helpers";

dayjs.extend(customParseFormat);

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
      return now.subtract(value, "month").startOf("month");
    case "calendar_years":
      return dayjs(`${now.year() - (value - 1)}-01-01`);
    case "since":
      return dayjs(since, "DD/MM/YYYY");
    case "all_time":
      return dayjs('17/12/1903', 'DD/MM/YYYY');
    case "days":
    default:
      return now.subtract(value, "day");
  }
};

// function to get the expiration date for landings
const getEndDate = (rule, lastEventDate) => {
  const { unit, value } = rule.time_frame;

  switch (unit) {
    case "calendar_months":
      return lastEventDate.add(value, "month").startOf("month");
    case "calendar_years":
      return dayjs(`${lastEventDate.year() + value}-01-01`);
    case "days":
    default:
      return lastEventDate.add(value, "day");
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

export const parseSubMetrics = (subMetrics) => {
  if (!subMetrics) return [];
  if (Array.isArray(subMetrics)) return subMetrics;
  try {
    const parsed = JSON.parse(subMetrics);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getFlightMetricValue = (flight, metric) => {
  if (!flight || !metric) return 0;
  if (metric === "landings.all") {
    const day = parseMetricValue(flight.landings?.day);
    const night = parseMetricValue(flight.landings?.night);
    return day + night;
  }
  const value = metric.split('.').reduce((obj, k) => obj?.[k], flight);
  return parseMetricValue(value);
};

export const evaluateCurrency = (flights, rule, aircrafts) => {
  if (!flights || flights.length === 0) return null;

  const regs = resolveAircraftsFromFilters(rule.filters, aircrafts);
  const filteredFlights = flights.filter(flight => {
    return regs.size === 0 || regs.has(flight.aircraft?.reg_name);
  });

  const since = getStartDate(rule);

  const qualifyingFlights = filteredFlights.filter(flight => {
    const flightDate = dayjs(flight.date, "DD/MM/YYYY");
    if (!flightDate.isValid() || flightDate.isBefore(since)) return false;
    return true;
  });

  const total = qualifyingFlights.reduce((sum, flight) => {
    return sum + getFlightMetricValue(flight, rule.metric);
  }, 0);

  const mainMeets = compareValues(total, rule.comparison, rule.target_value);

  const subMetrics = parseSubMetrics(rule.sub_metrics);
  const subResults = subMetrics.map(sub => {
    // Sub-metric is tied to main metric: only sum for flights where main metric > 0
    const subTotal = qualifyingFlights
      .filter(flight => getFlightMetricValue(flight, rule.metric) > 0)
      .reduce((sum, flight) => sum + getFlightMetricValue(flight, sub.metric), 0);

    const meetsRequirement = compareValues(subTotal, sub.comparison, sub.target_value);
    const targetVal = Number(sub.target_value) || 0;
    const percent = targetVal === 0 && subTotal > 0 ? 100 : (subTotal / (targetVal || 1)) * 100;

    return {
      ...sub,
      current: subTotal,
      target_value: targetVal,
      meetsRequirement,
      percent,
    };
  });

  const allSubMeets = subResults.every(sub => sub.meetsRequirement);
  const overallMeets = mainMeets && allSubMeets;

  const result = {
    current: total,
    meetsRequirement: overallMeets,
    mainMeets: mainMeets,
    subResults: subResults,
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

const getSingleMetricExpiry = (filteredFlights, metric, comparison, targetValue, timeFrame) => {
  if (!filteredFlights || filteredFlights.length === 0 || !metric) return null;

  if (timeFrame?.unit === 'since' || timeFrame?.unit === 'all_time') {
    return null; // no expiry for all_time and since rules
  }

  if (metric.startsWith('landings')) {
    const selector = (() => {
      if (metric === 'landings.day') return (f) => parseInt(f?.landings?.day) || 0;
      if (metric === 'landings.night') return (f) => parseInt(f?.landings?.night) || 0;
      return (f) => (parseInt(f?.landings?.day) || 0) + (parseInt(f?.landings?.night) || 0);
    })();

    const events = [];
    filteredFlights.forEach(f => {
      const d = dayjs(f?.date, 'DD/MM/YYYY');
      if (!d.isValid()) return;
      const cnt = Math.max(0, selector(f));
      for (let i = 0; i < cnt; i++) events.push(d);
    });

    const target = Number(targetValue) || 0;
    if (events.length < target) return null;
    events.sort((a, b) => b.valueOf() - a.valueOf());

    const event = events[target !== 0 ? target - 1 : 0];
    return getEndDate({ time_frame: timeFrame }, event);
  }

  // Time-based (e.g., time.pic_time, time.total_time, sim.time):
  // Expiry is the date when the oldest needed flight exits the rolling window (days).
  const unit = timeFrame?.unit;
  const windowDays = unit === 'days' ? Number(timeFrame?.value) : null;
  if (!windowDays || isNaN(windowDays) || windowDays <= 0) return null;

  // Only meaningful for threshold comparisons (>= or >). Others return null.
  const operator = comparison ?? '>=';
  if (!['>=', '>'].includes(operator)) return null;
  const target = Number(targetValue);
  if (isNaN(target)) return null;

  const today = dayjs().startOf('day');
  const windowStart = today.subtract(windowDays, 'day').add(1, 'day'); // inclusive window [start..today]

  // Collect flights within the window with their metric values
  const flightsInWindow = filteredFlights
    .map(f => ({ f, d: dayjs(f?.date, 'DD/MM/YYYY') }))
    .filter(({ d }) => d.isValid() && !d.isBefore(windowStart) && !d.isAfter(today))
    .map(({ f, d }) => {
      const amount = getFlightMetricValue(f, metric);
      return { d, amount };
    })
    .filter(({ amount }) => !isNaN(amount) && amount > 0)
    .sort((a, b) => a.d.valueOf() - b.d.valueOf()); // ascending by date

  // Current sum within the window
  const total = flightsInWindow.reduce((s, x) => s + x.amount, 0);
  const meets = operator === '>=' ? total >= target : total > target;
  if (!meets) {
    // Not current today. Compute the most recent expiry in the past (last time the rule was still valid).
    const allFlights = filteredFlights
      .map(f => ({ d: dayjs(f?.date, 'DD/MM/YYYY'), amount: getFlightMetricValue(f, metric) }))
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

export const getCurrencyExpiryForRule = (flights, rule, aircrafts) => {
  if (!flights || flights.length === 0 || !rule?.metric) return null;

  const regs = resolveAircraftsFromFilters(rule.filters, aircrafts);
  const filteredFlights = flights.filter(flight => {
    return regs.size === 0 || regs.has(flight.aircraft?.reg_name);
  });

  const mainExpiry = getSingleMetricExpiry(filteredFlights, rule.metric, rule.comparison, rule.target_value, rule.time_frame);

  const subMetrics = parseSubMetrics(rule.sub_metrics);
  if (subMetrics.length === 0) {
    return mainExpiry;
  }

  const flightsTiedToMain = filteredFlights.filter(f => getFlightMetricValue(f, rule.metric) > 0);
  const expiries = [mainExpiry];

  for (const sub of subMetrics) {
    const subExpiry = getSingleMetricExpiry(flightsTiedToMain, sub.metric, sub.comparison, sub.target_value, rule.time_frame);
    expiries.push(subExpiry);
  }

  const validExpiries = expiries.filter(e => e && dayjs.isDayjs(e) && e.isValid());
  if (validExpiries.length === 0) return null;

  validExpiries.sort((a, b) => a.valueOf() - b.valueOf());
  return validExpiries[0];
};

export const getStatusBarColor = (meetsRequirement, percent, comparison) => {
  if (comparison === '>=' || comparison === '>') {
    if (meetsRequirement) {
      return 'success';
    }
    if (percent >= 75) return 'warning';
    return 'error';
  }

  if (comparison === '<=' || comparison === '<') {
    if (percent >= 75) return 'warning';
    if (percent < 75) return 'success';
    return 'error';
  }

  if (meetsRequirement) {
    return 'success';
  }

  // default to error if we can't determine the status
  return 'error';
};