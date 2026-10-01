/**
 * 用真实的 SQLite 引擎（Node 内置 node:sqlite）验证：
 *   1. src-tauri/migrations/001_init.sql 建出的表结构可用；
 *   2. sqlBuilders 生成的 SQL 能被 SQLite 真正执行（占位符/参数严格对齐）；
 *   3. upsert 语义正确（同 id 重复写入是更新而不是报错或重复插入）。
 *
 * 这补齐了「桌面端写库路径」的自动化验证。
 */

import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  SESSION_COLUMNS,
  TODO_COLUMNS,
  buildUpsertSql,
  sessionParams,
  todoParams,
} from "./sqlBuilders";

const MIGRATION_SQL = readFileSync(
  new URL("../../src-tauri/migrations/001_init.sql", import.meta.url),
  "utf8",
);

function createDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(MIGRATION_SQL);
  return db;
}

function upsertTodos(db, todos) {
  const updateColumns = TODO_COLUMNS.filter((c) => c !== "id");
  const sql = buildUpsertSql("todos", TODO_COLUMNS, updateColumns, todos.length);
  db.prepare(sql).run(...todos.flatMap(todoParams));
}

function upsertSessions(db, sessions) {
  const updateColumns = SESSION_COLUMNS.filter((c) => c !== "id");
  const sql = buildUpsertSql("pomodoro_sessions", SESSION_COLUMNS, updateColumns, sessions.length);
  db.prepare(sql).run(...sessions.flatMap(sessionParams));
}

describe("迁移脚本建表", () => {
  it("创建了全部预期的表与索引", () => {
    const db = createDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((row) => row.name);
    expect(tables).toContain("todos");
    expect(tables).toContain("pomodoro_sessions");
    expect(tables).toContain("task_labels");
    expect(tables).toContain("app_meta");

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
      .all()
      .map((row) => row.name);
    expect(indexes.length).toBeGreaterThanOrEqual(4);
  });
});

describe("任务写入与 upsert 语义", () => {
  it("单条任务能写入并按 id 读回", () => {
    const db = createDb();
    upsertTodos(db, [
      {
        id: "t-1",
        title: "写周报",
        status: "pending",
        estimated_hours: 2,
        ddl: "2026-10-02T15:00:00.000Z",
        repeat_rule: "none",
        priority: 3,
        label: "工作",
        progress_percent: 0,
        pomodoro_total_seconds: 0,
        created_at: "2026-10-01T00:00:00.000Z",
      },
    ]);
    const row = db.prepare("SELECT * FROM todos WHERE id = ?").get("t-1");
    expect(row.title).toBe("写周报");
    expect(row.estimated_hours).toBe(2);
    expect(row.priority).toBe(3);
    expect(row.label).toBe("工作");
    expect(row.deleted_at).toBeNull();
  });

  it("同一 id 重复写入是更新而非重复插入", () => {
    const db = createDb();
    upsertTodos(db, [{ id: "t-2", title: "初稿", status: "pending" }]);
    upsertTodos(db, [{ id: "t-2", title: "定稿", status: "done" }]);

    const count = db.prepare("SELECT COUNT(*) AS c FROM todos").get().c;
    const row = db.prepare("SELECT * FROM todos WHERE id = ?").get("t-2");
    expect(count).toBe(1);
    expect(row.title).toBe("定稿");
    expect(row.status).toBe("done");
  });

  it("批量多行写入全部成功（验证占位符与参数对齐）", () => {
    const db = createDb();
    const rows = Array.from({ length: 30 }).map((_, i) => ({
      id: `bulk-${i}`,
      title: `任务 ${i}`,
      status: i % 2 === 0 ? "pending" : "done",
      estimated_hours: i,
      priority: i % 11,
    }));
    upsertTodos(db, rows);
    const count = db.prepare("SELECT COUNT(*) AS c FROM todos").get().c;
    expect(count).toBe(30);
  });

  it("中文、引号、换行等文本可安全落库（参数化绑定，无注入风险）", () => {
    const db = createDb();
    const tricky = `任务 '；DROP TABLE todos; -- 与 "引号" 和\n换行`;
    upsertTodos(db, [{ id: "t-3", title: tricky }]);
    const row = db.prepare("SELECT title FROM todos WHERE id = ?").get("t-3");
    expect(row.title).toBe(tricky);
    // 表依然存在，说明没有被注入执行
    expect(db.prepare("SELECT COUNT(*) AS c FROM todos").get().c).toBe(1);
  });
});

describe("番茄钟会话写入与删除", () => {
  it("会话可批量写入并按 start_time 读回", () => {
    const db = createDb();
    upsertSessions(db, [
      { id: "s-1", session_key: "k1", task_id: "t-1", duration_seconds: 1500, start_time: "2026-10-01T09:00:00.000Z", end_time: "2026-10-01T09:25:00.000Z" },
      { id: "s-2", session_key: "k2", task_id: "t-1", duration_seconds: 600, start_time: "2026-10-01T10:00:00.000Z", end_time: "2026-10-01T10:10:00.000Z" },
    ]);
    const rows = db.prepare("SELECT * FROM pomodoro_sessions ORDER BY start_time").all();
    expect(rows.length).toBe(2);
    expect(rows[0].session_key).toBe("k1");
    expect(rows[1].duration_seconds).toBe(600);
  });

  it("删除单条会话后其余保留", () => {
    const db = createDb();
    upsertSessions(db, [
      { id: "s-1", task_id: "t-1", duration_seconds: 60 },
      { id: "s-2", task_id: "t-1", duration_seconds: 60 },
    ]);
    db.prepare("DELETE FROM pomodoro_sessions WHERE id = ?").run("s-1");
    const ids = db.prepare("SELECT id FROM pomodoro_sessions").all().map((r) => r.id);
    expect(ids).toEqual(["s-2"]);
  });
});

describe("标签库", () => {
  it("覆盖写入后只保留最后一次的标签", () => {
    const db = createDb();
    db.exec("DELETE FROM task_labels");
    const labels = ["工作", "学习", "生活"];
    const values = labels.map(() => "(?,?)").join(",");
    db.prepare(`INSERT OR IGNORE INTO task_labels (label, sort_order) VALUES ${values}`).run(
      ...labels.flatMap((label, index) => [label, index]),
    );
    const rows = db.prepare("SELECT label FROM task_labels ORDER BY sort_order").all();
    expect(rows.map((r) => r.label)).toEqual(labels);
  });
});
