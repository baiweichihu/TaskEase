function normalizeString(value) {
  return String(value || "").trim();
}

function toTs(value) {
  const ts = new Date(value || "").getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function isCloudPomodoroSessionId(value) {
  const id = normalizeString(value);
  return /^\d+$/.test(id);
}

export function getPomodoroSessionSyncKey(session) {
  const sessionKey = normalizeString(session?.session_key);
  if (sessionKey) return sessionKey;

  const taskId = normalizeString(session?.task_id);
  const durationSeconds = Math.max(0, Number(session?.duration_seconds || 0));
  const startTime = normalizeString(session?.start_time);
  const endTime = normalizeString(session?.end_time);
  return `${taskId}|${durationSeconds}|${startTime}|${endTime}`;
}

function mergePomodoroSessionRecords(existing, incoming) {
  if (!existing) return { ...incoming };
  if (!incoming) return { ...existing };

  const existingCloud = isCloudPomodoroSessionId(existing.id);
  const incomingCloud = isCloudPomodoroSessionId(incoming.id);
  const merged = { ...existing, ...incoming };

  if (existingCloud && !incomingCloud) {
    merged.id = existing.id;
  } else if (!existingCloud && incomingCloud) {
    merged.id = incoming.id;
  } else {
    merged.id = existing.id || incoming.id;
  }

  merged.session_key = normalizeString(existing.session_key) || normalizeString(incoming.session_key) || normalizeString(merged.id);
  merged.local_dirty = Boolean(existing.local_dirty || incoming.local_dirty);
  return merged;
}

export function dedupePomodoroSessionList(sessions) {
  const merged = new Map();

  for (const session of Array.isArray(sessions) ? sessions : []) {
    if (!session || !session.id) continue;
    const key = getPomodoroSessionSyncKey(session);
    const current = merged.get(key);
    merged.set(key, mergePomodoroSessionRecords(current, session));
  }

  return Array.from(merged.values()).sort((a, b) => toTs(b.start_time) - toTs(a.start_time));
}
