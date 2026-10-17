import { describe, expect, it } from "vitest";
import { isInlineSafe, orderInputSchema, validateAttachments } from "./schemas";

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
