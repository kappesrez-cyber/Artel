import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "./navigation";

const appDir = join(import.meta.dirname, "..", "app");

describe("routes", () => {
  it.each(Object.entries(routes))("у адреса %s (%s) есть страница", (_, href) => {
    expect(existsSync(join(appDir, href, "page.tsx"))).toBe(true);
  });
});
