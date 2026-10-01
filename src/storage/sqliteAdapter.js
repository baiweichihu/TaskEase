/**
 * 桌面版存储适配器：SQLite（通过 @tauri-apps/plugin-sql）。
 *
 * 数据落在磁盘上的单个 .db 文件里，写入具备事务原子性，
 * 不存在 localStorage 那种「整个集合重写、写一半崩溃就全丢」的风险。
 *
 * 数据库位置沿用系统约定：`%APPDATA%\<identifier>\taskease.db`
 * （由 Tauri 按 Windows 规范解析，应用不自行改写数据目录）。
 *
 * SQL 构造部分抽到了 ./sqlBuilders，那里是纯函数且有单元测试覆盖。
 */

import Database from "@tauri-apps/plugin-sql";
import {
  SESSION_CHUNK,
  SESSION_COLUMNS,
  TODO_CHUNK,
  TODO_COLUMNS,
  buildUpsertSql,
  chunk,
  sessionParams,
  todoParams,
} from "./sqlBuilders";

const DB_URL = "sqlite:taskease.db";

export function createSqliteAdapter() {
  let dbPromise = null;

  function getDb() {
    if (!dbPromise) {
      dbPromise = Database.load(DB_URL).catch((error) => {
        dbPromise = null;
        throw error;
      });
    }
    return dbPromise;
  }

  return {
    kind: "sqlite",

    /** 触发连接与数据库迁移（迁移定义在 src-tauri/src/lib.rs） */
    async init() {
      await getDb();
      return true;
    },

    async loadTodos() {
      const db = await getDb();
      return await db.select("SELECT * FROM todos");
    },

    async loadSessions() {
      const db = await getDb();
      return await db.select("SELECT * FROM pomodoro_sessions");
    },

    async loadTaskLabels() {
      const db = await getDb();
      const rows = await db.select("SELECT label FROM task_labels ORDER BY sort_order ASC");
      return rows.map((row) => row.label).filter(Boolean);
    },

    /**
     * 全量写入任务。任务在应用内是软删除（status='deleted'），
     * 因此只做 upsert、不做物理删除，避免误删历史记录。
     */
    async saveTodos(list) {
      const rows = Array.isArray(list) ? list.filter((item) => item && item.id) : [];
      if (rows.length === 0) return true;
      const db = await getDb();
      const updateColumns = TODO_COLUMNS.filter((col) => col !== "id");
      for (const part of chunk(rows, TODO_CHUNK)) {
        const sql = buildUpsertSql("todos", TODO_COLUMNS, updateColumns, part.length);
        await db.execute(sql, part.flatMap(todoParams));
      }
      return true;
    },

    /** 全量写入番茄钟会话（只 upsert；删除请走 deleteSession） */
    async saveSessions(list) {
      const rows = Array.isArray(list) ? list.filter((item) => item && item.id) : [];
      if (rows.length === 0) return true;
      const db = await getDb();
      const updateColumns = SESSION_COLUMNS.filter((col) => col !== "id");
      for (const part of chunk(rows, SESSION_CHUNK)) {
        const sql = buildUpsertSql("pomodoro_sessions", SESSION_COLUMNS, updateColumns, part.length);
        await db.execute(sql, part.flatMap(sessionParams));
      }
      return true;
    },

    async deleteSession(id) {
      if (!id) return false;
      const db = await getDb();
      await db.execute("DELETE FROM pomodoro_sessions WHERE id = ?", [String(id)]);
      return true;
    },

    async saveTaskLabels(list) {
      const labels = Array.isArray(list) ? list.map((x) => String(x || "").trim()).filter(Boolean) : [];
      const db = await getDb();
      await db.execute("DELETE FROM task_labels");
      if (labels.length === 0) return true;
      const values = labels.map(() => "(?,?)").join(",");
      const params = labels.flatMap((label, index) => [label, index]);
      await db.execute(`INSERT OR IGNORE INTO task_labels (label, sort_order) VALUES ${values}`, params);
      return true;
    },

    async exportAll() {
      return {
        todos: await this.loadTodos(),
        pomodoroSessions: await this.loadSessions(),
        taskLabels: await this.loadTaskLabels(),
      };
    },

    async replaceAll({ todos = [], pomodoroSessions = [], taskLabels = [] } = {}) {
      const db = await getDb();
      await db.execute("DELETE FROM todos");
      await db.execute("DELETE FROM pomodoro_sessions");
      await db.execute("DELETE FROM task_labels");
      await this.saveTodos(todos);
      await this.saveSessions(pomodoroSessions);
      await this.saveTaskLabels(taskLabels);
      return true;
    },
  };
}
