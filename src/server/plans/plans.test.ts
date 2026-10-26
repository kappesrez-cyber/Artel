import { describe, expect, it } from "vitest";
import { commissionFor, effectiveTier, getPlan, nextPlanUntil, plans, PLAN_DAYS } from "./plans";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-18T12:00:00Z");

describe("тарифы", () => {
  it("три тарифа по возрастанию цены", () => {
    expect(plans.map((p) => [p.name, p.price])).toEqual([
      ["Старт", 0],
      ["Про", 27_000],
      ["Холдинг", 149_000],
    ]);
  });

  it("чем дороже тариф, тем ниже комиссия и сильнее продвижение", () => {
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i]!.commission).toBeLessThan(plans[i - 1]!.commission);
      expect(plans[i]!.bonusStars).toBeGreaterThan(plans[i - 1]!.bonusStars);
      expect(plans[i]!.searchBoost).toBeGreaterThan(plans[i - 1]!.searchBoost);
    }
  });

  it("помощь с документами только на Холдинге", () => {
    expect(plans.filter((p) => p.docsHelp).map((p) => p.tier)).toEqual(["HOLDING"]);
  });

  it("истёкший тариф считается Стартом", () => {
    expect(effectiveTier({ plan: "PRO", planUntil: new Date(now.getTime() + day) }, now)).toBe(
      "PRO",
    );
    expect(effectiveTier({ plan: "PRO", planUntil: new Date(now.getTime() - 1) }, now)).toBe(
      "FREE",
    );
    expect(effectiveTier({ plan: "HOLDING", planUntil: null }, now)).toBe("FREE");
  });

  it("комиссия считается по тарифу", () => {
    expect(commissionFor("FREE", 2_000_000)).toBe(180_000);
    expect(commissionFor("PRO", 2_000_000)).toBe(100_000);
    expect(commissionFor("HOLDING", 2_000_000)).toBe(0);
    expect(commissionFor("PRO", 333.33)).toBe(16.67);
    expect(getPlan("HOLDING").name).toBe("Холдинг");
  });

  it("продление того же тарифа добавляет месяц к остатку, другой начинается сразу", () => {
    const until = new Date(now.getTime() + 10 * day);
    expect(nextPlanUntil({ plan: "PRO", planUntil: until }, "PRO", now).getTime()).toBe(
      until.getTime() + PLAN_DAYS * day,
    );
    expect(nextPlanUntil({ plan: "PRO", planUntil: until }, "HOLDING", now).getTime()).toBe(
      now.getTime() + PLAN_DAYS * day,
    );
    expect(nextPlanUntil({ plan: "FREE", planUntil: null }, "PRO", now).getTime()).toBe(
      now.getTime() + PLAN_DAYS * day,
    );
  });
});
