/**
 * A task is included in auto-plan only if at least one of: estimated hours > 0, due date, or priority > 0.
 * Missing hours are inferred (see derivePlanningEffort) so ddl-only / priority-only still schedules.
 */
export function hasPlanningSignal(todo) {
  const est = Number(todo.estimated_hours);
  const hasEst = Number.isFinite(est) && est > 0;
  const hasDdl = Boolean(todo.ddl);
  const pri = Number(todo.priority);
  const hasPri = Number.isFinite(pri) && pri > 0;
  return hasEst || hasDdl || hasPri;
}

export function derivePlanningEffort(todo) {
  const raw = Number(todo.estimated_hours);
  if (Number.isFinite(raw) && raw > 0) {
    return { hours: raw, inferred: false, reason: "estimate" };
  }

  const hasDdl = Boolean(todo.ddl);
  const pri = Number.isFinite(Number(todo.priority)) ? Number(todo.priority) : 0;

  let hours = 0.5;
  const bits = [];

  if (hasDdl) {
    hours = Math.max(hours, 1);
    bits.push("ddl");
  }
  if (pri > 0) {
    hours = Math.max(hours, 0.6 + pri * 0.12);
    bits.push("priority");
  }

  hours = Math.min(hours, 8);
  return { hours, inferred: true, reason: bits.length ? bits.join("+") : "default" };
}

/**
 * Greedy schedule: sort plannable active tasks by deadline (soonest first, no deadline last),
 * then by priority descending; pack using derivePlanningEffort hours.
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
    return (Number(b.priority) || 0) - (Number(a.priority) || 0);
  });

  let remaining = hours;
  const suggestions = [];

  for (const todo of sorted) {
    if (remaining <= 1e-9) break;

    const { hours: need, inferred, reason } = derivePlanningEffort(todo);
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
