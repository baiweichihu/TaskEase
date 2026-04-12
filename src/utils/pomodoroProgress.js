function normalizePercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Apply pomodoro progress only when a session is stopped/committed.
 * Formula: next = base + sessionSeconds / (estimatedHours * 3600) * 100
 */
export function applyPomodoroStopProgress(baseProgress, estimatedHours, sessionSeconds) {
  const base = normalizePercent(baseProgress);
  const estHours = Number(estimatedHours);
  const secs = Math.max(0, Math.floor(Number(sessionSeconds || 0)));

  if (!Number.isFinite(estHours) || estHours <= 0 || secs <= 0) {
    return base;
  }

  const estimatedSeconds = estHours * 3600;
  const delta = (secs / estimatedSeconds) * 100;
  return normalizePercent(Math.min(100, base + delta));
}
