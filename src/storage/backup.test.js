import { describe, expect, it } from "vitest";
import { applyBackupText, parseBackup } from "./backup";

function makeBackup(overrides = {}) {
  return JSON.stringify({
    format: "taskease-backup",
    version: 1,
    app: "TaskEase",
    exportedAt: "2026-10-01T00:00:00.000Z",
    todos: [{ id: "t-1", title: "任务一" }],
    pomodoroSessions: [{ id: "s-1", task_id: "t-1", duration_seconds: 1500 }],
    taskLabels: ["工作"],
    ...overrides,
  });
}

describe("parseBackup", () => {
  it("能解析出任务、会话与标签三部分", () => {
    const parsed = parseBackup(makeBackup());
    expect(parsed.todos).toHaveLength(1);
    expect(parsed.pomodoroSessions).toHaveLength(1);
    expect(parsed.taskLabels).toEqual(["工作"]);
    expect(parsed.exportedAt).toBe("2026-10-01T00:00:00.000Z");
  });

  it("缺少数组字段时退化为空数组，不会抛错", () => {
    const parsed = parseBackup(makeBackup({ todos: undefined, taskLabels: "bad" }));
    expect(parsed.todos).toEqual([]);
    expect(parsed.taskLabels).toEqual([]);
  });

  it("拒绝非法 JSON", () => {
    expect(() => parseBackup("{ not json")).toThrow(/合法的 JSON/);
  });

  it("拒绝不是 TaskEase 备份的 JSON", () => {
    expect(() => parseBackup(JSON.stringify({ hello: "world" }))).toThrow(/不是 TaskEase 的备份/);
  });

  it("拒绝被替换成数组等非对象结构的内容", () => {
    expect(() => parseBackup("[1,2,3]")).toThrow(/不是 TaskEase 的备份/);
  });
});

describe("applyBackupText", () => {
  it("格式不对时在写入任何数据之前就失败（保护现有数据）", async () => {
    await expect(applyBackupText(JSON.stringify({ hello: "world" }))).rejects.toThrow(
      /不是 TaskEase 的备份/,
    );
  });

  it("格式不对的非法 JSON 同样不会写入", async () => {
    await expect(applyBackupText("not json at all")).rejects.toThrow(/合法的 JSON/);
  });
});
