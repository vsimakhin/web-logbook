import dayjs from "dayjs";

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
