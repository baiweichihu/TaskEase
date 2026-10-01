/**
 * 存储层统一入口。
 *
 * 业务代码只依赖这里导出的 `storage` 接口，不关心底层是 SQLite 还是 localStorage。
 * 这样做的两个目的：
 *   1. 同一份代码产出「桌面版（SQLite）」与「网页 demo（localStorage）」两个产物；
 *   2. 将来若扩展到 Tauri 移动端，只需新增一个适配器。
 *
 * 接口约定（全部为 async）：
 *   init()                   初始化（桌面端会触发数据库迁移）
 *   loadTodos()              读取全部任务
 *   loadSessions()           读取全部番茄钟会话
 *   loadTaskLabels()         读取标签库
 *   saveTodos(list)          全量 upsert 任务
 *   saveSessions(list)       全量 upsert 会话
 *   deleteSession(id)        删除单个会话
 *   saveTaskLabels(list)     覆盖标签库
 *   exportAll()              导出全部数据（备份用）
 *   replaceAll(payload)      整体覆盖（恢复备份用）
 */

import { createSqliteAdapter } from "./sqliteAdapter";
import { createWebAdapter } from "./webAdapter";

/** Tauri 2 会在注入的 WebView 里挂上 __TAURI_INTERNALS__ */
function isTauriRuntime() {
  if (typeof window === "undefined") return false;
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

export const storageKind = isTauriRuntime() ? "sqlite" : "web";
export const isDesktop = storageKind === "sqlite";

export const storage = isDesktop ? createSqliteAdapter() : createWebAdapter();
