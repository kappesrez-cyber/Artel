import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("принимает корректные переменные", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    });
    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("подставляет NODE_ENV по умолчанию", () => {
    const env = parseEnv({ DATABASE_URL: "postgresql://localhost:5432/db" });
    expect(env.NODE_ENV).toBe("development");
  });

  it("отклоняет отсутствующий DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("пустой SELLER_API_TOKEN выключает API продавца, короткий отклоняется", () => {
    const base = { DATABASE_URL: "postgresql://localhost:5432/db" };
    expect(parseEnv({ ...base, SELLER_API_TOKEN: "" }).SELLER_API_TOKEN).toBeUndefined();
    expect(() => parseEnv({ ...base, SELLER_API_TOKEN: "short" })).toThrow(/SELLER_API_TOKEN/);
  });
});
