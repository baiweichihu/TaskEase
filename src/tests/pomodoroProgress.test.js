import { describe, expect, test } from "vitest";
import { applyPomodoroStopProgress } from "../utils/pomodoroProgress";

describe("applyPomodoroStopProgress", () => {
  test("adds stopped pomodoro time on top of existing progress", () => {
    // 1800s is 50% of 1h estimate, so 20 + 50 = 70
    expect(applyPomodoroStopProgress(20, 1, 1800)).toBe(70);
  });

  test("does not change progress when session seconds are zero", () => {
    expect(applyPomodoroStopProgress(35, 2, 0)).toBe(35);
  });

  test("does not change progress when estimate is missing", () => {
    expect(applyPomodoroStopProgress(35, 0, 900)).toBe(35);
  });

  test("caps progress at 100", () => {
    expect(applyPomodoroStopProgress(95, 1, 1800)).toBe(100);
  });
});
