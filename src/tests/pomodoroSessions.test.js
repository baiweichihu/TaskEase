import { describe, expect, test } from "vitest";
import { dedupePomodoroSessionList, getPomodoroSessionSyncKey } from "../utils/pomodoroSessions";

describe("pomodoro session sync helpers", () => {
  test("prefers session_key when present", () => {
    expect(
      getPomodoroSessionSyncKey({
        id: "123",
        session_key: "stable-key",
        task_id: "task-a",
        duration_seconds: 1200,
        start_time: "2026-04-12T10:00:00.000Z",
        end_time: "2026-04-12T10:20:00.000Z",
      }),
    ).toBe("stable-key");
  });

  test("falls back to legacy content key when session_key is missing", () => {
    expect(
      getPomodoroSessionSyncKey({
        id: "local-uuid",
        task_id: "task-a",
        duration_seconds: 1200,
        start_time: "2026-04-12T10:00:00.000Z",
        end_time: "2026-04-12T10:20:00.000Z",
      }),
    ).toBe("task-a|1200|2026-04-12T10:00:00.000Z|2026-04-12T10:20:00.000Z");
  });

  test("dedupes sessions that share the same session_key and keeps the cloud id", () => {
    const rows = dedupePomodoroSessionList([
      {
        id: "local-uuid",
        session_key: "stable-key",
        task_id: "task-a",
        duration_seconds: 1200,
        start_time: "2026-04-12T10:00:00.000Z",
        end_time: "2026-04-12T10:20:00.000Z",
        local_dirty: true,
      },
      {
        id: "321",
        session_key: "stable-key",
        task_id: "task-a",
        duration_seconds: 1200,
        start_time: "2026-04-12T10:00:00.000Z",
        end_time: "2026-04-12T10:20:00.000Z",
        local_dirty: false,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("321");
    expect(rows[0].session_key).toBe("stable-key");
    expect(rows[0].local_dirty).toBe(true);
  });
});
