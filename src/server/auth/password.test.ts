import { describe, expect, it } from "vitest";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "./password";

describe("пароли", () => {
  it("проверяет правильный пароль и отклоняет неправильный", async () => {
    const hash = await hashPassword("секретный-пароль");
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await verifyPassword("секретный-пароль", hash)).toBe(true);
    expect(await verifyPassword("другой-пароль", hash)).toBe(false);
  });

  it("одинаковые пароли дают разные хэши (соль)", async () => {
    expect(await hashPassword("pass1234")).not.toBe(await hashPassword("pass1234"));
  });

  it("битый хэш и заглушка не пропускают", async () => {
    expect(await verifyPassword("x", "plain")).toBe(false);
    expect(await verifyPassword("", DUMMY_PASSWORD_HASH)).toBe(false);
  });
});
