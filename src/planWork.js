/**
 * A task is included in auto-plan only if it has an estimated duration.
 */
export function hasPlanningSignal(todo) {
  const est = Number(todo.estimated_hours);
  return Number.isFinite(est) && est > 0;
}

export function derivePlanningEffort(todo) {
  const raw = Number(todo.estimated_hours);
  if (Number.isFinite(raw) && raw > 0) {
    return { hours: raw, inferred: false, reason: "estimate" };
  }

  return { hours: 0, inferred: false, reason: "missing_estimate" };
}

/**
 * Greedy schedule: sort plannable active tasks by deadline (soonest first, no deadline last),
 * then by priority ascending with 0 treated as unspecified and placed last; pack using estimate hours.
 */
export function computeWorkPlan(todos, availableHours, statusDone) {
  const hours = Number(availableHours);
  if (!Number.isFinite(hours) || hours <= 0) {
    return { ok: false, reason: "invalid_hours", suggestions: [], unusedHours: hours };
  }

  const active = (Array.isArray(todos) ? todos : []).filter((x) => x && x.status !== statusDone);
  const plannable = active.filter(hasPlanningSignal);
  if (plannable.length === 0) {
    return { ok: false, reason: "no_tasks", suggestions: [], unusedHours: hours };
  }

  const sorted = [...plannable].sort((a, b) => {
    const da = a.ddl ? new Date(a.ddl).getTime() : Number.POSITIVE_INFINITY;
    const db = b.ddl ? new Date(b.ddl).getTime() : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    const pa = Number(a.priority) || 0;
    const pb = Number(b.priority) || 0;
    const rankA = pa > 0 ? pa : Number.POSITIVE_INFINITY;
    const rankB = pb > 0 ? pb : Number.POSITIVE_INFINITY;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });

  let remaining = hours;
  const suggestions = [];

  for (const todo of sorted) {
    if (remaining <= 1e-9) break;

    const { hours: need, inferred, reason } = derivePlanningEffort(todo);
    if (need <= 0) continue;
    const alloc = Math.min(remaining, need);

    suggestions.push({
      id: todo.id,
      title: todo.title || "",
      allocateHours: alloc,
      needHours: need,
      inferred,
      inferReason: reason,
      partial: alloc < need - 1e-9,
      ddl: todo.ddl ?? null,
      priority: Number(todo.priority) || 0,
    });
    remaining -= alloc;
  }

  return {
    ok: true,
    reason: null,
    suggestions,
    unusedHours: Math.max(0, remaining),
  };
}
