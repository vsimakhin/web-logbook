// custom filter function for date range for datatables
export const dateFilterFn = (row, columnId, filterValue) => {
  const rowDate = new Date(row.original.date).getTime();
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