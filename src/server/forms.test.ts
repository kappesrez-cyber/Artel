import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AccountError } from "./auth/accounts";
import { ConflictError, ForbiddenError, NotFoundError } from "./errors";
import { safeNext, toFormState } from "./forms";

describe("toFormState", () => {
  it.each([
    new AccountError("a"),
    new ForbiddenError("f"),
    new ConflictError("c"),
    new NotFoundError("n"),
  ])("показывает текст ошибки %s", (error) => {
    expect(toFormState(error)).toEqual({ error: error.message });
  });

  it("ошибки Zod раскладывает по полям, вложенные — через точку", () => {
    const schema = z.object({ organization: z.object({ name: z.string().min(1, "пусто") }) });
    const state = toFormState(schema.safeParse({ organization: { name: "" } }).error);
    expect(state.fieldErrors).toEqual({ "organization.name": ["пусто"] });
  });

  it("прочие ошибки не раскрывает", () => {
    expect(toFormState(new Error("секрет")).error).not.toContain("секрет");
  });
});

describe("safeNext", () => {
  it("пропускает адреса этого сайта", () => {
    expect(safeNext("/market/1?x=2", "/profile")).toBe("/market/1?x=2");
  });

  it("не пускает на другой сайт", () => {
    for (const next of ["//evil.example", "/\\evil.example", "https://evil.example", "", null]) {
      expect(safeNext(next, "/profile")).toBe("/profile");
    }
  });
});
