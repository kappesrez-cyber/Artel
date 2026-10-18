import { describe, expect, it } from "vitest";
import { fillDescription, isInlineSafe, orderInputSchema, validateAttachments } from "./schemas";

const base = {
  title: "Подшипник 6205",
  description: "Замена импортному подшипнику в комбайне",
  contactName: "Иван",
  contactPhone: "+7 900 000-00-00",
};

describe("orderInputSchema", () => {
  it("принимает минимальный заказ, пустые поля превращает в null", () => {
    const order = orderInputSchema.parse({ ...base, budget: "", quantity: "", stars: "" });
    expect(order.budget).toBeNull();
    expect(order.quantity).toBeNull();
    expect(order.stars).toBeNull();
  });

  it("понимает бюджет с пробелами и запятой", () => {
    expect(orderInputSchema.parse({ ...base, budget: "1 250 000,50" }).budget).toBe(1250000.5);
  });

  it("требует телефон или email", () => {
    const result = orderInputSchema.safeParse({ ...base, contactPhone: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["contactPhone"]);
  });
});

describe("опросник заказа", () => {
  it("разбирает ответы опросника", () => {
    const order = orderInputSchema.parse({
      ...base,
      needKind: "IMPORT_REPLACEMENT",
      originalBrand: "SKF",
      originalArticle: "6205-2RSH",
      analogAllowed: "yes",
      recurrence: "QUARTERLY",
      requiredDocuments: ["Паспорт качества", "Паспорт качества"],
    });
    expect(order).toMatchObject({
      needKind: "IMPORT_REPLACEMENT",
      analogAllowed: true,
      recurrence: "QUARTERLY",
      requiredDocuments: ["Паспорт качества"],
    });
    expect(orderInputSchema.parse({ ...base, analogAllowed: "" }).analogAllowed).toBeNull();
    expect(orderInputSchema.safeParse({ ...base, needKind: "OTHER" }).success).toBe(false);
  });

  it("собирает описание из ответов, если его не написали", () => {
    const filled = fillDescription({
      ...base,
      description: "  ",
      needKind: "IMPORT_REPLACEMENT",
      originalBrand: "SKF",
      originalArticle: "6205-2RSH",
      application: "привод жатки Claas Lexion",
    });
    expect(filled.description).toBe(
      "Ищем отечественную замену импортной позиции: SKF 6205-2RSH. Применение: привод жатки Claas Lexion.",
    );
    expect(orderInputSchema.safeParse(filled).success).toBe(true);
    expect(fillDescription(base).description).toBe(base.description);
  });
});

const file = (size: number, name = "tz.pdf") => new File([new Uint8Array(size)], name);

describe("validateAttachments", () => {
  it("отбрасывает пустые поля выбора файла", () => {
    const files = validateAttachments([
      { kind: "SPECIFICATION", file: file(0, "") },
      { kind: "TECHNICAL", file: file(10) },
    ]);
    expect(files).toHaveLength(1);
  });

  it("не пускает больше 4 МБ вместе", () => {
    expect(() =>
      validateAttachments([
        { kind: "SPECIFICATION", file: file(3 * 1024 * 1024) },
        { kind: "TECHNICAL", file: file(2 * 1024 * 1024) },
      ]),
    ).toThrow(/4 МБ/);
  });
});

describe("isInlineSafe", () => {
  it("открывает в браузере только PDF и картинки", () => {
    expect(isInlineSafe("application/pdf")).toBe(true);
    expect(isInlineSafe("image/png")).toBe(true);
    expect(isInlineSafe("image/svg+xml")).toBe(false);
    expect(isInlineSafe("text/html")).toBe(false);
  });
});
