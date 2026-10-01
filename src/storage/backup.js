/**
 * 备份导出 / 导入。
 *
 * 备份是一个可读的 JSON 文件，包含任务、番茄钟会话与标签库三部分。
 * 桌面端走系统原生的「保存 / 打开」对话框（文件读写交给 Rust 命令完成，
 * 因此不需要额外的文件系统权限）；网页 demo 退化为浏览器下载与文件选择。
 */

import { isDesktop, storage } from "./index";

const BACKUP_FORMAT = "taskease-backup";
const BACKUP_VERSION = 1;
const FILE_FILTERS = [{ name: "JSON", extensions: ["json"] }];

export function buildBackupFileName() {
  return `TaskEase-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

async function buildBackupPayload() {
  const data = await storage.exportAll();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: "TaskEase",
    exportedAt: new Date().toISOString(),
    todos: data.todos ?? [],
    pomodoroSessions: data.pomodoroSessions ?? [],
    taskLabels: data.taskLabels ?? [],
  };
}

/** 校验并解析备份内容；格式不对时抛出可读的中文错误 */
export function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("文件不是合法的 JSON");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("备份文件内容为空或格式不正确");
  }
  if (parsed.format !== BACKUP_FORMAT) {
    throw new Error("这不是 TaskEase 的备份文件");
  }
  return {
    exportedAt: String(parsed.exportedAt || ""),
    todos: Array.isArray(parsed.todos) ? parsed.todos : [],
    pomodoroSessions: Array.isArray(parsed.pomodoroSessions) ? parsed.pomodoroSessions : [],
    taskLabels: Array.isArray(parsed.taskLabels) ? parsed.taskLabels : [],
  };
}

function downloadInBrowser(fileName, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function pickFileInBrowser() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

/**
 * 导出备份。
 * 返回 { ok, cancelled, path }：cancelled 表示用户取消了保存对话框。
 */
export async function exportBackup() {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const fileName = buildBackupFileName();

  if (isDesktop) {
    const [{ save }, { invoke }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/api/core"),
    ]);
    const path = await save({ defaultPath: fileName, filters: FILE_FILTERS });
    if (!path) return { ok: false, cancelled: true, path: "" };
    await invoke("write_backup_file", { path, contents: json });
    return { ok: true, cancelled: false, path };
  }

  downloadInBrowser(fileName, json);
  return { ok: true, cancelled: false, path: fileName };
}

/** 校验备份内容并整体覆盖本地数据 */
export async function applyBackupText(text) {
  const parsed = parseBackup(text);
  await storage.replaceAll(parsed);
  return {
    ok: true,
    exportedAt: parsed.exportedAt,
    counts: {
      todos: parsed.todos.length,
      sessions: parsed.pomodoroSessions.length,
      labels: parsed.taskLabels.length,
    },
  };
}

/**
 * 选择备份文件并导入（会覆盖当前全部数据）。
 * 返回 { ok, cancelled, counts }。
 */
export async function importBackup() {
  if (isDesktop) {
    const [{ open }, { invoke }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/api/core"),
    ]);
    const selected = await open({ multiple: false, directory: false, filters: FILE_FILTERS });
    if (!selected || typeof selected !== "string") {
      return { ok: false, cancelled: true };
    }
    const text = await invoke("read_backup_file", { path: selected });
    return { ...(await applyBackupText(text)), path: selected };
  }

  const text = await pickFileInBrowser();
  if (text == null) return { ok: false, cancelled: true };
  return await applyBackupText(text);
}
