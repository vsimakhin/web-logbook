import dayjs from "dayjs";

export const calculateExpiry = (validUntil) => {
  if (!validUntil) return null;

  const today = dayjs();

  if (!validUntil.isValid()) return null;

  const diffMonths = validUntil.diff(today, 'month');
  const remainingDays = validUntil.diff(today.add(diffMonths, 'month'), 'day');
  const diffDays = validUntil.diff(today, 'day');

  return { months: diffMonths, days: remainingDays, diffDays };
};