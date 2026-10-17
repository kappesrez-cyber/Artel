import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { modeForPath, routes } from "./navigation";

const appDir = join(import.meta.dirname, "..", "app");

describe("routes", () => {
  it.each(Object.entries(routes))("у адреса %s (%s) есть страница", (_, href) => {
    expect(existsSync(join(appDir, href, "page.tsx"))).toBe(true);
  });
});

describe("modeForPath", () => {
  it("рынок заказов — режим продавца", () => {
    expect(modeForPath("/market")).toBe("seller");
    expect(modeForPath("/market/abc")).toBe("seller");
  });

  it("всё остальное — режим покупателя", () => {
    expect(modeForPath("/")).toBe("buyer");
    expect(modeForPath("/search")).toBe("buyer");
    expect(modeForPath("/marketing")).toBe("buyer");
  });
});
