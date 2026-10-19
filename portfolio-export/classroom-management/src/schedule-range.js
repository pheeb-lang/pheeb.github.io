export function addDateDays(value, offset) {
  const date = new Date(value + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function scheduleDates(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      start.toISOString().slice(0, 10) !== startDate || end.toISOString().slice(0, 10) !== endDate) return [];
  const length = (end - start) / 86400000 + 1;
  if (length < 1 || length > 6) return [];
  return Array.from({length}, (_, offset) => addDateDays(startDate, offset));
}
