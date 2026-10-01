/**
 * SQL 构造工具（纯函数，无任何 Tauri 依赖，可被单元测试覆盖）。
 *
 * 这里最关键的不变式是：生成的 SQL 里 `?` 占位符的个数必须严格等于
 * 绑定参数数组的长度，否则执行时会报错或参数错位。单元测试专门盯这一点。
 */

export const TODO_COLUMNS = [
  "id",
  "title",
  "status",
  "estimated_hours",
  "ddl",
  "remark",
  "repeat_rule",
  "repeat_until_date",
  "priority",
  "label",
  "progress_percent",
  "pomodoro_total_seconds",
  "created_at",
  "deleted_at",
];

export const SESSION_COLUMNS = [
  "id",
  "session_key",
  "task_id",
  "duration_seconds",
  "start_time",
  "end_time",
];

/** 单条 INSERT 允许绑定多少行（SQLite 变量上限保护） */
export const TODO_CHUNK = 50; // 50 × 14 列 = 700 个占位符
export const SESSION_CHUNK = 100; // 100 × 6 列 = 600 个占位符

/** SQLite 不接受 undefined，统一归一化；数字列保证落库是数字 */
export function normalizeValue(value, kind) {
  if (value === undefined || value === null || value === "") {
    return kind === "number" ? 0 : null;
  }
  if (kind === "number") {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  return String(value);
}

export function todoParams(todo) {
  const source = todo || {};
  return [
    normalizeValue(source.id, "text"),
    normalizeValue(source.title, "text") ?? "",
    normalizeValue(source.status, "text") ?? "pending",
    normalizeValue(source.estimated_hours, "number"),
    normalizeValue(source.ddl, "text"),
    normalizeValue(source.remark, "text"),
    normalizeValue(source.repeat_rule, "text") ?? "none",
    normalizeValue(source.repeat_until_date, "text") ?? "",
    Math.trunc(normalizeValue(source.priority, "number")),
    normalizeValue(source.label, "text"),
    normalizeValue(source.progress_percent, "number"),
    normalizeValue(source.pomodoro_total_seconds, "number"),
    normalizeValue(source.created_at, "text"),
    normalizeValue(source.deleted_at, "text"),
  ];
}

export function sessionParams(session) {
  const source = session || {};
  return [
    normalizeValue(source.id, "text"),
    normalizeValue(source.session_key, "text") ?? "",
    normalizeValue(source.task_id, "text") ?? "",
    normalizeValue(source.duration_seconds, "number"),
    normalizeValue(source.start_time, "text"),
    normalizeValue(source.end_time, "text"),
  ];
}

export function buildUpsertSql(table, columns, updateColumns, rowCount) {
  const group = `(${columns.map(() => "?").join(",")})`;
  const values = Array.from({ length: rowCount }).map(() => group).join(",");
  const updates = updateColumns.map((col) => `${col}=excluded.${col}`).join(", ");
  return (
    `INSERT INTO ${table} (${columns.join(",")}) VALUES ${values} ` +
    `ON CONFLICT(id) DO UPDATE SET ${updates}`
  );
}

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
