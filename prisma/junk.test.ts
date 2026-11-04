import { describe, expect, it } from "vitest";
import { demoSellerProducts, techmashProducts } from "./demo-catalog";
import { demoCompanies } from "./demo-companies";
import { demoOrders } from "./demo-orders";
import { demoSellers } from "./demo-sellers";
import { isJunkText } from "./junk";

describe("тестовый мусор в каталоге и на рынке", () => {
  it("узнаёт записи «для проверки»", () => {
    for (const text of [
      "тест",
      "Тестовый товар",
      "asdf",
      "123",
      "..",
      "ааааа",
      "Проверка 2",
      "qwe qwe",
      "для проверки",
      "test order",
      "asdfgh",
      "йцукенг",
    ]) {
      expect(isJunkText(text), text).toBe(true);
    }
  });

  it("не трогает настоящие позиции", () => {
    for (const text of [
      "Тестомес спиральный",
      "Улучшитель для теста",
      "Клапан проверки давления гидросистемы трактора, ход 20 мм",
      "Вал",
      "Подшипник 6205-2RS",
    ]) {
      expect(isJunkText(text), text).toBe(false);
    }
  });

  it("демо-данные мусором не считаются", () => {
    const texts = [
      ...demoSellerProducts,
      ...techmashProducts,
      ...demoCompanies.flatMap((c) => c.products),
    ].map((p) => p.name);
    texts.push(...demoSellers.flatMap((s) => s.products.map((p) => p[0])));
    texts.push(...demoOrders.flatMap((o) => [o.title, o.description]));
    expect(texts.filter((t) => isJunkText(t))).toEqual([]);
  });

  it("продавцов и предложений — по 75–90, заказов — тоже", () => {
    const sellers = demoSellers.length + demoCompanies.length + 2;
    const products =
      demoSellers.reduce((n, s) => n + s.products.length, 0) +
      demoCompanies.reduce((n, c) => n + c.products.length, 0) +
      demoSellerProducts.length +
      techmashProducts.length;
    expect(sellers).toBeGreaterThanOrEqual(75);
    expect(sellers).toBeLessThanOrEqual(90);
    expect(products).toBeGreaterThanOrEqual(75);
    expect(products).toBeLessThanOrEqual(95);
    expect(demoOrders.length + 3).toBeGreaterThanOrEqual(75);
    expect(new Set(demoSellers.map((s) => s.name)).size).toBe(demoSellers.length);
  });
});
