export function normalizeDateKey(value) {
  const v = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
  const [yy, mm, dd] = v.split("-").map((x) => Number(x));
  const d = new Date(`${v}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return "";
  if (d.getFullYear() !== yy || d.getMonth() + 1 !== mm || d.getDate() !== dd) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addRepeatStep(baseDate, rule, stepCount = 1) {
  const d = new Date(baseDate);
  if (!Number.isFinite(d.getTime())) return null;
  if (stepCount <= 0) return d;

  if (rule === "daily") d.setDate(d.getDate() + stepCount);
  else if (rule === "weekly") d.setDate(d.getDate() + 7 * stepCount);
  else if (rule === "monthly") d.setMonth(d.getMonth() + stepCount);
  else return d;

  return d;
}

export function getNextRecurringIso(baseIso, rule) {
  if (!baseIso) return null;
  if (rule !== "daily" && rule !== "weekly" && rule !== "monthly") return null;
  const base = new Date(baseIso);
  if (!Number.isFinite(base.getTime())) return null;
  const next = addRepeatStep(base, rule, 1);
  return next ? next.toISOString() : null;
}

export function countOccurrencesByRule(startDateKey, endDateKey, rule) {
  const startKey = normalizeDateKey(startDateKey);
  const endKey = normalizeDateKey(endDateKey);
  if (!startKey || !endKey) return 0;
  if (rule !== "daily" && rule !== "weekly" && rule !== "monthly") return 0;

  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return 0;

  if (rule === "daily") {
    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  }

  if (rule === "weekly") {
    return Math.floor((end.getTime() - start.getTime()) / (7 * 86400000)) + 1;
  }

  let count = 1;
  let cursor = new Date(start);
  while (true) {
    const next = addRepeatStep(cursor, "monthly", 1);
    if (!next || next > end) break;
    count += 1;
    cursor = next;
    if (count > 2000) break;
  }
  return count;
}

export function getMaxRepeatUntilDate(startDateKey, rule, maxOccurrences = 30) {
  const startKey = normalizeDateKey(startDateKey);
  if (!startKey) return "";
  if (rule !== "daily" && rule !== "weekly" && rule !== "monthly") return "";
  const start = new Date(`${startKey}T00:00:00`);
  if (!Number.isFinite(start.getTime())) return "";

  const steps = Math.max(0, Number(maxOccurrences || 30) - 1);
  const maxDate = addRepeatStep(start, rule, steps);
  if (!maxDate) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${maxDate.getFullYear()}-${pad(maxDate.getMonth() + 1)}-${pad(maxDate.getDate())}`;
}
