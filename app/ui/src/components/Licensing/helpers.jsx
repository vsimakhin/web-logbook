import dayjs from "dayjs";

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