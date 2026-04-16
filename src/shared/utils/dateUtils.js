function toDateSafe(value) {
  if (!value) return null;
  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** @param {Date} [date] @param {string} timeZone — IANA, e.g. `America/Los_Angeles` */
export function ymdInTimeZone(date = new Date(), timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatShowLabel(dateStr) {
  const date = toDateSafe(`${dateStr}T12:00:00`);
  if (!date) return dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthYear(value) {
  const date = toDateSafe(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
