import { describe, expect, it } from "vitest";
import {
  SESSION_CHUNK,
  SESSION_COLUMNS,
  TODO_CHUNK,
  TODO_COLUMNS,
  buildUpsertSql,
  chunk,
  normalizeValue,
  sessionParams,
  todoParams,
} from "./sqlBuilders";

function countPlaceholders(sql) {
  return (sql.match(/\?/g) ?? []).length;
}

describe("buildUpsertSql", () => {
  it("占位符数量必须等于 行数 × 列数（任务）", () => {
    for (const rowCount of [1, 2, 7, TODO_CHUNK]) {
      const updateColumns = TODO_COLUMNS.filter((c) => c !== "id");
      const sql = buildUpsertSql("todos", TODO_COLUMNS, updateColumns, rowCount);
      expect(countPlaceholders(sql)).toBe(rowCount * TODO_COLUMNS.length);
    }
  });

  it("占位符数量必须等于 行数 × 列数（番茄钟会话）", () => {
    for (const rowCount of [1, 3, SESSION_CHUNK]) {
      const updateColumns = SESSION_COLUMNS.filter((c) => c !== "id");
      const sql = buildUpsertSql("pomodoro_sessions", SESSION_COLUMNS, updateColumns, rowCount);
      expect(countPlaceholders(sql)).toBe(rowCount * SESSION_COLUMNS.length);
    }
  });

  it("使用 ON CONFLICT(id) 做幂等更新，且不更新主键自身", () => {
    const updateColumns = TODO_COLUMNS.filter((c) => c !== "id");
    const sql = buildUpsertSql("todos", TODO_COLUMNS, updateColumns, 1);
    expect(sql).toContain("ON CONFLICT(id) DO UPDATE SET");
    expect(sql).not.toContain("id=excluded.id");
    expect(sql).toContain("title=excluded.title");
  });
});

describe("参数构造与占位符一一对应", () => {
  it("任务：单条参数个数等于列数，且与占位符数量一致", () => {
    const todo = {
      id: "t-1",
      title: "写周报",
      status: "pending",
      estimated_hours: 2,
      ddl: "2026-10-02T15:00:00.000Z",
      remark: null,
      repeat_rule: "none",
      repeat_until_date: "",
      priority: 3,
      label: "工作",
      progress_percent: 0,
      pomodoro_total_seconds: 0,
      created_at: "2026-10-01T00:00:00.000Z",
      deleted_at: "",
    };
    const params = todoParams(todo);
    const updateColumns = TODO_COLUMNS.filter((c) => c !== "id");
    const sql = buildUpsertSql("todos", TODO_COLUMNS, updateColumns, 1);
    expect(params.length).toBe(TODO_COLUMNS.length);
    expect(countPlaceholders(sql)).toBe(params.length);
  });

  it("任务：多行批量参数总数与占位符完全匹配", () => {
    const rows = [1, 2, 3].map((n) => ({ id: `t-${n}`, title: `任务${n}` }));
    const updateColumns = TODO_COLUMNS.filter((c) => c !== "id");
    const sql = buildUpsertSql("todos", TODO_COLUMNS, updateColumns, rows.length);
    const params = rows.flatMap(todoParams);
    expect(countPlaceholders(sql)).toBe(params.length);
    expect(params.length).toBe(rows.length * TODO_COLUMNS.length);
  });

  it("会话：多行批量参数总数与占位符完全匹配", () => {
    const rows = [1, 2].map((n) => ({ id: `s-${n}`, task_id: `t-${n}`, duration_seconds: 1500 }));
    const updateColumns = SESSION_COLUMNS.filter((c) => c !== "id");
    const sql = buildUpsertSql("pomodoro_sessions", SESSION_COLUMNS, updateColumns, rows.length);
    const params = rows.flatMap(sessionParams);
    expect(countPlaceholders(sql)).toBe(params.length);
    expect(params.length).toBe(rows.length * SESSION_COLUMNS.length);
  });
});

describe("normalizeValue", () => {
  it("空值在数字列上归零、在文本列上归 null（SQLite 不接受 undefined）", () => {
    expect(normalizeValue(undefined, "number")).toBe(0);
    expect(normalizeValue(null, "number")).toBe(0);
    expect(normalizeValue("", "number")).toBe(0);
    expect(normalizeValue(undefined, "text")).toBeNull();
    expect(normalizeValue("", "text")).toBeNull();
  });

  it("非法数字不会写进数据库", () => {
    expect(normalizeValue("abc", "number")).toBe(0);
    expect(normalizeValue(Number.NaN, "number")).toBe(0);
  });

  it("数字列产出真正的 number，文本列产出 string", () => {
    expect(normalizeValue("2.5", "number")).toBe(2.5);
    expect(normalizeValue(7, "text")).toBe("7");
  });
});

describe("chunk", () => {
  it("按上限切分且不丢数据", () => {
    const list = Array.from({ length: 125 }).map((_, i) => i);
    const parts = chunk(list, 50);
    expect(parts.length).toBe(3);
    expect(parts.map((p) => p.length)).toEqual([50, 50, 25]);
    expect(parts.flat()).toEqual(list);
  });

  it("空数组不产生任何分片", () => {
    expect(chunk([], 50)).toEqual([]);
  });
});
