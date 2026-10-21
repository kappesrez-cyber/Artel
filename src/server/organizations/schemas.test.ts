import { describe, expect, it } from "vitest";
import { organizationInputSchema, organizationUpdateSchema } from "./schemas";

describe("organizationInputSchema", () => {
  it("пустые поля формы — это «не заполнено»", () => {
    const data = organizationInputSchema.parse({
      name: "ООО Пример",
      inn: "",
      ogrn: " ",
      website: "",
      email: "",
      foundedYear: "",
    });
    expect(data).toMatchObject({
      inn: null,
      ogrn: null,
      website: null,
      email: null,
      foundedYear: null,
    });
  });

  it("дописывает https:// к сайту и читает год из строки", () => {
    const data = organizationInputSchema.parse({
      name: "x",
      website: "example.ru",
      foundedYear: "2012",
    });
    expect(data.website).toBe("https://example.ru");
    expect(data.foundedYear).toBe(2012);
  });

  it.each([
    ["ИНН из 11 цифр", { inn: "12345678901" }],
    ["ОГРН из 12 цифр", { ogrn: "123456789012" }],
    ["сайт не по http", { website: "javascript:alert(1)" }],
  ])("отклоняет: %s", (_, patch) => {
    expect(organizationInputSchema.safeParse({ name: "x", ...patch }).success).toBe(false);
  });

  it("нельзя выключить сразу и продажи, и покупки", () => {
    expect(organizationUpdateSchema.safeParse({ isSeller: false, isBuyer: false }).success).toBe(
      false,
    );
    expect(organizationUpdateSchema.safeParse({ isSeller: false }).success).toBe(true);
  });
});
