import { describe, expect, it } from "vitest";
import { commissionFor, effectiveTier, getPlan, nextPlanUntil, plans, PLAN_DAYS } from "./plans";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-18T12:00:00Z");

describe("тарифы", () => {
  it("четыре тарифа по возрастанию цены", () => {
    expect(plans.map((p) => [p.name, p.price])).toEqual([
      ["Free", 0],
      ["Pro", 2500],
      ["Max", 7000],
      ["Ultra", 35000],
    ]);
  });

  it("чем дороже тариф, тем ниже комиссия и сильнее продвижение", () => {
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i]!.commission).toBeLessThan(plans[i - 1]!.commission);
      expect(plans[i]!.bonusStars).toBeGreaterThan(plans[i - 1]!.bonusStars);
      expect(plans[i]!.searchBoost).toBeGreaterThan(plans[i - 1]!.searchBoost);
    }
  });

  it("помощь с документами только на Ultra", () => {
    expect(plans.filter((p) => p.docsHelp).map((p) => p.tier)).toEqual(["ULTRA"]);
  });

  it("истёкший тариф считается Free", () => {
    expect(effectiveTier({ plan: "PRO", planUntil: new Date(now.getTime() + day) }, now)).toBe(
      "PRO",
    );
    expect(effectiveTier({ plan: "PRO", planUntil: new Date(now.getTime() - 1) }, now)).toBe(
      "FREE",
    );
    expect(effectiveTier({ plan: "MAX", planUntil: null }, now)).toBe("FREE");
  });

  it("комиссия считается по тарифу", () => {
    expect(commissionFor("FREE", 2_000_000)).toBe(100_000);
    expect(commissionFor("ULTRA", 2_000_000)).toBe(20_000);
    expect(commissionFor("PRO", 333.33)).toBe(10);
    expect(getPlan("MAX").popular).toBe(true);
  });

  it("продление того же тарифа добавляет месяц к остатку, другой начинается сразу", () => {
    const until = new Date(now.getTime() + 10 * day);
    expect(nextPlanUntil({ plan: "PRO", planUntil: until }, "PRO", now).getTime()).toBe(
      until.getTime() + PLAN_DAYS * day,
    );
    expect(nextPlanUntil({ plan: "PRO", planUntil: until }, "MAX", now).getTime()).toBe(
      now.getTime() + PLAN_DAYS * day,
    );
    expect(nextPlanUntil({ plan: "FREE", planUntil: null }, "PRO", now).getTime()).toBe(
      now.getTime() + PLAN_DAYS * day,
    );
  });
});
