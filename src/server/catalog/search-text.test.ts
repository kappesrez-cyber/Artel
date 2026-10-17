import { describe, expect, it } from "vitest";
import { buildSearchText, normalize, searchTerms } from "./search-text";

describe("поиск по тексту позиции", () => {
  const text = buildSearchText({
    name: "Деталь",
    city: "Анкоридж",
    organizationName: "ООО «Обнал»",
  });

  const matches = (query: string) => searchTerms(query).every((term) => text.includes(term));

  it("нормализует текст", () => {
    expect(text).toBe("деталь анкоридж ооо обнал");
    expect(normalize("  Ёлка-2000!  ")).toBe("елка 2000");
  });

  it.each(["деталь", "Деталь", "ДЕТАЛИ", "деталью", "детали обнал", "Анкоридж", "ооо"])(
    "находит по запросу «%s»",
    (query) => expect(matches(query)).toBe(true),
  );

  it.each(["насос", "деталь москва"])("не находит по запросу «%s»", (query) =>
    expect(matches(query)).toBe(false),
  );

  it("пустой запрос — без условий", () => {
    expect(searchTerms("   ")).toEqual([]);
  });

  it("ограничивает число слов и убирает повторы", () => {
    expect(searchTerms("деталь детали деталь")).toEqual(["детал"]);
    expect(searchTerms("а б в г д е ж з и к л м")).toHaveLength(8);
  });
});
