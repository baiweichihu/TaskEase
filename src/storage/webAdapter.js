/**
 * 网页版（demo）存储适配器：localStorage。
 *
 * 这套实现与原来的行为完全一致，存在的意义是让同一份业务代码
 * 既能在 Tauri 桌面端跑（SQLite），也能在浏览器里当 demo 跑。
 * demo 定位下浏览器本地存储的可靠性是「够用」的，不做额外加固。
 */

const TODOS_KEY = "taskease_todos_guest";
const SESSIONS_KEY = "taskease_pomodoro_sessions_guest";
const LABELS_KEY = "taskease_task_labels_guest";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("[storage:web] 写入失败", error);
  }
}

export function createWebAdapter() {
  return {
    kind: "web",

    async init() {
      return true;
    },

    async loadTodos() {
      const list = readJson(TODOS_KEY, []);
      return Array.isArray(list) ? list : [];
    },

    async loadSessions() {
      const list = readJson(SESSIONS_KEY, []);
      return Array.isArray(list) ? list : [];
    },

    async loadTaskLabels() {
      const list = readJson(LABELS_KEY, []);
      return Array.isArray(list) ? list : [];
    },

    async saveTodos(list) {
      writeJson(TODOS_KEY, Array.isArray(list) ? list : []);
      return true;
    },

    async saveSessions(list) {
      writeJson(SESSIONS_KEY, Array.isArray(list) ? list : []);
      return true;
    },

    async deleteSession(id) {
      const list = readJson(SESSIONS_KEY, []);
      const next = (Array.isArray(list) ? list : []).filter((item) => item.id !== id);
      writeJson(SESSIONS_KEY, next);
      return true;
    },

    async saveTaskLabels(list) {
      writeJson(LABELS_KEY, Array.isArray(list) ? list : []);
      return true;
    },

    /** 供「导出备份」使用：一次性取出全部数据 */
    async exportAll() {
      return {
        todos: await this.loadTodos(),
        pomodoroSessions: await this.loadSessions(),
        taskLabels: await this.loadTaskLabels(),
      };
    },

    /** 供「导入备份」使用：整体覆盖 */
    async replaceAll({ todos = [], pomodoroSessions = [], taskLabels = [] } = {}) {
      await this.saveTodos(todos);
      await this.saveSessions(pomodoroSessions);
      await this.saveTaskLabels(taskLabels);
      return true;
    },
  };
}
