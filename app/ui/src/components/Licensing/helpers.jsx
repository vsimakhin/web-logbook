import dayjs from "dayjs";
import { getValue } from "../../util/helpers";

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

export const createDateColumn = (id, name) => ({
  accessorKey: id,
  header: name,
  size: 150,
  filterVariant: "date-range", filterFn: "dateFilterFn",
  muiFilterDatePickerProps: { format: "DD/MM/YYYY" },
})

export const calculateExpiry = (validUntil) => {
  if (!validUntil) return null;

  const today = dayjs();
  const expiryDate = dayjs(validUntil, "DD/MM/YYYY");

  if (!expiryDate.isValid()) return null;

  const diffMonths = expiryDate.diff(today, 'month');
  const remainingDays = expiryDate.diff(today.add(diffMonths, 'month'), 'day');
  const diffDays = expiryDate.diff(today, 'day');

  return { months: diffMonths, days: remainingDays, diffDays };
};

export const getExpireColor = (days) => {
  if (days < 0) return 'error';
  if (days < 90) return 'warning';
  return 'inherit';
}
