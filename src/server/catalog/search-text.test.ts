import { describe, expect, it } from "vitest";
import {
  buildSearchText,
  codeVariants,
  extractCodes,
  normalize,
  parseQuery,
  queryScope,
  requiredMatches,
  searchTerms,
  switchLayout,
} from "./search-text";
import { SYNONYM_GROUPS, synonymsFor } from "./synonyms";

describe("разбор запроса", () => {
  it("нормализует текст", () => {
    expect(normalize("  Ёлка-2000!  ")).toBe("елка 2000");
  });

  it("убирает служебные слова и слова закупщика", () => {
    // Раньше «для» требовалось найти в карточке, и запрос не находил ничего.
    expect(parseQuery("Нужен подшипник для комбайна").terms.map((t) => t.word)).toEqual([
      "подшипник",
      "комбайна",
    ]);
    expect(parseQuery("ООО г. Москва").terms.map((t) => t.word)).toEqual(["москва"]);
  });

  it("добавляет синонимы к слову", () => {
    const [term] = parseQuery("сальники").terms;
    expect(term!.synonyms).toEqual(expect.arrayContaining(["манжета", "уплотнение", "seal"]));
    expect(term!.tsquery).toContain("манжета");
  });

  it("дописывает последнее слово префиксом, но не артикулы", () => {
    expect(parseQuery("вал подшип").terms.map((t) => t.tsquery)).toEqual([
      expect.not.stringContaining(":*"),
      expect.stringContaining("подшип:*"),
    ]);
    expect(parseQuery("6205").terms[0]!.tsquery).toBe("6205");
  });

  it("понимает английскую раскладку", () => {
    expect(switchLayout("gjlibgybr")).toBe("подшипник");
    expect(parseQuery("gjlibgybr").terms[0]!.tsquery).toContain("подшипник");
  });

  it("в tsquery только буквы, цифры и операторы", () => {
    const { terms } = parseQuery(`подшипник' & !(drop) "6205" <-> ||`);
    for (const t of terms) expect(t.tsquery).toMatch(/^[\p{L}\p{N}|&():* ]+$/u);
  });

  it("не исправляет опечатки в коротких словах и артикулах", () => {
    const flags = Object.fromEntries(
      parseQuery("вал цепь 6205 подшибник").terms.map((t) => [t.word, t.fuzzy]),
    );
    expect(flags).toEqual({ вал: false, цепь: true, "6205": false, подшибник: true });
  });

  it("ограничивает число слов и убирает повторы", () => {
    expect(parseQuery("деталь деталь").terms).toHaveLength(1);
    expect(parseQuery("а1 б1 в1 г1 д1 е1 ж1 з1 и1 к1").terms).toHaveLength(8);
    expect(parseQuery("   ").terms).toEqual([]);
  });

  it("сколько слов должна покрыть позиция", () => {
    expect([1, 2, 3, 4, 5, 6].map(requiredMatches)).toEqual([1, 2, 2, 3, 4, 4]);
  });

  it("основы слов для рынка заказов", () => {
    expect(searchTerms("манжеты для погрузчика")).toEqual(["манжет", "погрузчик"]);
  });
});

describe("артикулы", () => {
  it("собирает артикулы из текста слитно", () => {
    expect(extractCodes("SKF 6205-2RSH, FAG 6205-2RSR; ПР-25,4")).toEqual([
      "62052rsh",
      "62052rsr",
      "пр254",
    ]);
  });

  it("учитывает русские буквы в латинском артикуле", () => {
    // Похожие буквы (Р = P, С = C) и написание по звучанию (рс = rs).
    expect(codeVariants("6205-2РС")).toEqual(["62052рс", "62052pc", "62052rs"]);
    expect(codeVariants("6205-2RS")).toEqual(["62052rs"]);
  });

  it("склеивает артикул, разбитый пробелом", () => {
    expect(parseQuery("подшипник 6205 2RS").codes).toContain("62052rs");
  });

  it("текст позиции содержит артикулы и аналоги слитно", () => {
    const text = buildSearchText({
      name: "Подшипник 6205-2RS",
      article: "ПШ-6205-2RS",
      analogs: "SKF 6205-2RSH",
      city: "Воронеж",
      organizationName: "ООО «МеталлАгро»",
    });
    expect(text.split(" ")).toEqual(
      expect.arrayContaining([
        "подшипник",
        "skf",
        "воронеж",
        "металлагро",
        "62052rs",
        "пш62052rs",
        "62052rsh",
      ]),
    );
  });
});

describe("словарь синонимов", () => {
  it("записан строчными буквами без ё и без повторов", () => {
    const all = SYNONYM_GROUPS.flat();
    for (const word of all) expect(word).toMatch(/^[a-zа-я0-9 -]+$/);
    expect(new Set(all).size).toBe(all.length);
  });

  it("синоним находится в любой форме слова", () => {
    expect(synonymsFor("ремня")).toContain("belt");
    expect(synonymsFor("насосы")).toContain("pump");
    expect(synonymsFor("неизвестное")).toEqual([]);
  });
});

describe("артикул из соседних слов", () => {
  it("не склеивает обычное слово с числом", () => {
    expect(parseQuery("подшипник 6205 для комбайна").codes).toEqual([]);
    expect(parseQuery("ремень spb 2000").codes).toContain("spb2000");
  });
});

describe("запрос без слов", () => {
  // Раньше «...» считался пустым запросом, и на точки выдавался весь каталог.
  it.each([
    "...",
    ".",
    " . . . ",
    "…",
    "?!",
    ",,;",
    "- -",
    "—",
    "«»",
    "()[]{}",
    "*/+=",
    "№",
    " \t. \n",
  ])("«%s» ничего не ищет", (query) => {
    expect(parseQuery(query).terms).toEqual([]);
    expect(parseQuery(query).codes).toEqual([]);
    expect(queryScope(query)).toBe("none");
    expect(searchTerms(query)).toEqual([]);
  });

  it("из одних служебных слов тоже ничего не ищет", () => {
    expect(queryScope("для и на")).toBe("none");
  });

  it("пустая строка и пробелы показывают всё", () => {
    expect(queryScope("")).toBe("all");
    expect(queryScope("   ")).toBe("all");
  });

  it("слово или артикул в окружении знаков ищутся", () => {
    expect(queryScope("...подшипник...")).toBe("search");
    expect(queryScope("6205-2RS.")).toBe("search");
  });
});
