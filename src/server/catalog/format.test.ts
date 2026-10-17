import { describe, expect, it } from "vitest";
import { formatDate, formatPrice, readyDate } from "./format";

describe("readyDate", () => {
  it("прибавляет срок к сегодняшнему дню", () => {
    const now = new Date("2026-10-17T12:00:00Z");
    expect(formatDate(readyDate(7, now))).toBe("24.10.2026");
    expect(formatDate(readyDate(0, now))).toBe("17.10.2026");
  });

  it("считает «сегодня» по Москве", () => {
    // 22:30 UTC 17-го — в Москве уже 18-е.
    expect(formatDate(readyDate(7, new Date("2026-10-17T22:30:00Z")))).toBe("25.10.2026");
  });

  it("переходит через месяц и год", () => {
    expect(formatDate(readyDate(7, new Date("2026-12-28T09:00:00Z")))).toBe("04.01.2027");
  });
});

describe("formatPrice", () => {
  it("делит разряды и не показывает нулевые копейки", () => {
    expect(formatPrice("1000000.00")).toBe("1 000 000 ₽");
  });

  it("показывает копейки, если они есть", () => {
    expect(formatPrice("1500.5")).toBe("1 500,50 ₽");
  });
});
