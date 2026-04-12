import { describe, expect, test } from "vitest";
import { computeWorkPlan } from "../planWork";

describe("computeWorkPlan", () => {
  test("skips tasks without estimated hours", () => {
    const todos = [
      { id: 1, title: "No estimate but high priority", status: "active", priority: 3, ddl: null },
    ];

    const result = computeWorkPlan(todos, 4, "done");

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_tasks");
    expect(result.suggestions).toHaveLength(0);
  });

  test("orders estimated tasks by due date and then lower priority number first", () => {
    const todos = [
      { id: 1, title: "Priority 3 no due", status: "active", estimated_hours: 2, priority: 3, ddl: null },
      { id: 2, title: "Priority 1 no due", status: "active", estimated_hours: 5, priority: 1, ddl: null },
      { id: 3, title: "Due sooner", status: "active", estimated_hours: 1, priority: 2, ddl: "2026-04-12T10:00:00.000Z" },
    ];

    const result = computeWorkPlan(todos, 10, "done");

    expect(result.ok).toBe(true);
    expect(result.suggestions.map((item) => item.id)).toEqual([3, 2, 1]);
    expect(result.suggestions[0].inferred).toBe(false);
    expect(result.suggestions[1].inferred).toBe(false);
  });
});