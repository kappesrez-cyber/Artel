import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it.each([
    ["ООО «Агро Маш»", "АМ"],
    ["ООО МеталлАгро", "МЕ"],
    ["АО «Сибирский элеватор»", "СЭ"],
    ["Иван Петров", "ИП"],
    ["ООО", "ОО"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
