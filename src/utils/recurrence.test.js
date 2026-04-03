import { describe, expect, test } from "vitest";
import {
  countOccurrencesByRule,
  getMaxRepeatUntilDate,
  getNextRecurringIso,
  normalizeDateKey,
} from "./recurrence";

describe("recurrence utilities", () => {
  test("normalizeDateKey rejects invalid values", () => {
    expect(normalizeDateKey("2026-02-31")).toBe("");
    expect(normalizeDateKey("abc")).toBe("");
  });

  test("countOccurrencesByRule daily/weekly/monthly", () => {
    expect(countOccurrencesByRule("2026-04-01", "2026-04-30", "daily")).toBe(30);
    expect(countOccurrencesByRule("2026-04-01", "2026-05-27", "weekly")).toBe(9);
    expect(countOccurrencesByRule("2026-01-15", "2026-03-15", "monthly")).toBe(3);
  });

  test("max repeat date uses 30 occurrences", () => {
    expect(getMaxRepeatUntilDate("2026-04-01", "daily", 30)).toBe("2026-04-30");
    expect(getMaxRepeatUntilDate("2026-04-01", "weekly", 30)).toBe("2026-10-21");
    expect(getMaxRepeatUntilDate("2026-04-01", "monthly", 30)).toBe("2028-09-01");
  });

  test("getNextRecurringIso advances by rule", () => {
    const base = "2026-04-03T12:00:00.000Z";
    expect(getNextRecurringIso(base, "daily")).toBe("2026-04-04T12:00:00.000Z");
    expect(getNextRecurringIso(base, "weekly")).toBe("2026-04-10T12:00:00.000Z");
    expect(getNextRecurringIso(base, "monthly")).toBe("2026-05-03T12:00:00.000Z");
  });
});
