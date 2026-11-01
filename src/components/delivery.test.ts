import { describe, expect, it } from "vitest";
import { findCity, roadKm, transitDays } from "./delivery";

describe("delivery", () => {
  it("находит город без учёта регистра и ё", () => {
    expect(findCity("екатеринбург")?.name).toBe("Екатеринбург");
    expect(findCity("Анкоридж")).toBeUndefined();
  });

  it("считает расстояние по дорогам с поправкой", () => {
    const km = roadKm(findCity("Москва")!, findCity("Екатеринбург")!);
    // По прямой около 1420 км.
    expect(km).toBeGreaterThan(1700);
    expect(km).toBeLessThan(1900);
  });

  it("по городу доставка за день, далеко — дольше", () => {
    expect(transitDays(0)).toBe(1);
    expect(transitDays(600)).toBe(2);
    expect(transitDays(1800)).toBe(4);
  });
});
