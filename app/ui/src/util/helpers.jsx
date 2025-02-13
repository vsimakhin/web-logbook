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