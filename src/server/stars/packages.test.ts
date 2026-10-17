import { describe, expect, it } from "vitest";
import { findStarPackage, starPackages } from "./packages";

describe("starPackages", () => {
  it("крупный пакет не дороже за звезду, чем мелкий", () => {
    const perStar = starPackages.map((p) => p.price / p.stars);
    expect(perStar).toEqual([...perStar].sort((a, b) => b - a));
  });

  it("продаёт только пакеты из списка", () => {
    expect(findStarPackage(5)?.price).toBe(450);
    expect(findStarPackage(7)).toBeUndefined();
  });
});
