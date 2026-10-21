import { describe, expect, it } from "vitest";
import { changePercent, fillDays, parsePeriod, percent, ratingHistogram } from "./metrics";

describe("расчёты аналитики", () => {
  it("период из адреса", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod(["90"])).toBe(90);
    expect(parsePeriod("365")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
  });

  it("изменение и доля", () => {
    expect(changePercent(15, 10)).toBe(50);
    expect(changePercent(5, 0)).toBeNull();
    expect(percent(3, 40)).toBe(7.5);
    expect(percent(1, 0)).toBeNull();
  });

  it("ряд по дням без пропусков, по московскому времени", () => {
    // 23:30 UTC 17 октября — в Москве уже 18-е.
    const now = new Date("2026-10-17T23:30:00Z");
    expect(fillDays([{ day: "2026-10-17", value: 4 }], 3, now)).toEqual([
      { day: "2026-10-16", value: 0 },
      { day: "2026-10-17", value: 4 },
      { day: "2026-10-18", value: 0 },
    ]);
  });

  it("распределение оценок", () => {
    expect(
      ratingHistogram([
        { rating: 5, count: 3 },
        { rating: 2, count: 1 },
      ]),
    ).toEqual([0, 1, 0, 0, 3]);
  });
});
