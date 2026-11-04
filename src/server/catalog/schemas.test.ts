import { describe, expect, it } from "vitest";
import { productInputSchema, productUpdateSchema } from "./schemas";

const valid = { name: "Вал приводной", price: 1000000, leadTimeDays: 7, city: "Воронеж" };

describe("productInputSchema", () => {
  it("принимает позицию и по умолчанию делает черновик", () => {
    expect(productInputSchema.parse(valid)).toMatchObject({
      price: "1000000",
      status: "DRAFT",
    });
  });

  it("принимает цену строкой с запятой", () => {
    expect(productInputSchema.parse({ ...valid, price: "99,90" }).price).toBe("99.90");
  });

  it.each([
    ["пустое название", { name: " " }],
    ["отрицательная цена", { price: -1 }],
    ["лишние знаки в цене", { price: "1.999" }],
    ["дробный срок", { leadTimeDays: 1.5 }],
    ["неизвестный статус", { status: "SOLD" }],
  ])("отклоняет: %s", (_, patch) => {
    expect(productInputSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("productUpdateSchema", () => {
  it("позволяет менять поля по отдельности, не подставляя статус", () => {
    expect(productUpdateSchema.parse({ leadTimeDays: 14 })).toEqual({ leadTimeDays: 14 });
  });
});
