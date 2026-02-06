export function getMonthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getWorkingDaysOfMonth(dateInMonth: Date) {
  const year = dateInMonth.getFullYear();
  const month = dateInMonth.getMonth(); // 0-based
  const first = new Date(year, month, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const days: Date[] = [];
  for (let d = new Date(first); d < nextMonth; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0 Sun, 1 Mon, ... 6 Sat
    if (dow >= 1 && dow <= 5) days.push(new Date(d));
  }
  return days;
}

export function formatHR(date: Date) {
  // date.month.year
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}.`;
}

export function isoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
