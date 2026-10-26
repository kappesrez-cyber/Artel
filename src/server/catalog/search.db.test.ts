// Поиск на реальных запросах покупателей. Нужна база с миграциями (`npm run db:start`,
// `npm run db:deploy`); без DATABASE_URL тест пропускается. Запуск: `npm run test:db`.
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { obnalProducts, techmashProducts } from "../../../prisma/demo-catalog";

const enabled = Boolean(process.env.DATABASE_URL) && process.env.SEARCH_DB_TEST !== "0";

describe.skipIf(!enabled)("поиск по каталогу (PostgreSQL)", async () => {
  const { db } = await import("@/server/db");
  const { createProduct } = await import("./products");
  const { rankProducts } = await import("./search");

  // Свои предприятия с уникальным названием: тест не зависит от сида и убирает за собой.
  const tag = `тест-поиска-${Date.now()}`;
  const ids = new Map<string, string>();
  let orgIds: string[] = [];

  beforeAll(async () => {
    const [a, b] = await Promise.all(
      [`ООО Обнал ${tag}`, `ООО Техмаш ${tag}`].map((name) =>
        db().organization.create({ data: { name, city: "Тест" }, select: { id: true } }),
      ),
    );
    orgIds = [a!.id, b!.id];
    for (const [orgId, list] of [
      [a!.id, obnalProducts],
      [b!.id, techmashProducts],
    ] as const) {
      for (const product of list) {
        ids.set(product.name, (await createProduct(orgId, product)).id);
      }
    }
  });

  afterAll(async () => {
    await db().organization.deleteMany({ where: { id: { in: orgIds } } });
  });

  /** Названия наших позиций в выдаче по порядку (позиции сида и других тестов пропускаем). */
  async function search(query: string) {
    const outcome = await rankProducts(query, 100);
    const names = new Map([...ids].map(([name, id]) => [id, name]));
    return {
      ...outcome,
      names: outcome.ids.flatMap((id) => (names.has(id) ? [names.get(id)!] : [])),
    };
  }

  const bearing = "Подшипник шариковый радиальный 6205-2RS";
  const seal = "Манжета армированная 45×65×10";

  it.each([
    // Формы слова и служебные слова.
    ["подшипник", bearing],
    ["подшипники для комбайна", bearing],
    ["нужен шариковый подшипник", bearing],
    // Артикулы: свой, импортного аналога, с пробелом, русскими буквами, без разделителей.
    ["6205-2RS", bearing],
    ["6205 2rs", bearing],
    ["62052рс", bearing],
    ["SKF 6205-2RSH", bearing],
    ["аналог FAG 6205-2RSR", bearing],
    ["0007382910", "Фильтр гидравлический"],
    ["H213333", "Сегмент ножа жатки"],
    ["пр-25,4", "Цепь приводная роликовая ПР-25,4"],
    // Синонимы и английские названия.
    ["сальник 45х65", seal],
    ["уплотнение вала", seal],
    ["bearing", bearing],
    ["ремень belt spb", "Ремень приводной клиновой SPB 2000"],
    ["фермент для хлеба", "Амилаза грибковая для хлебопечения"],
    ["нож жатки", "Сегмент ножа жатки"],
    // Раскладка и недопечатанное слово.
    ["gjlibgybr", bearing],
    ["подшип", bearing],
    // Город и производитель.
    ["вал анкоридж", "Вал приводной жатки"],
  ])("«%s» → %s первым", async (query, expected) => {
    const { names, mode } = await search(query);
    expect(names[0]).toBe(expected);
    expect(mode).toBe("exact");
  });

  it.each([
    ["подшибник", bearing, "подшипник"],
    ["падшипник шариковый", bearing, "подшипник"],
    ["сигмент ножа", "Сегмент ножа жатки", "сегмент"],
    ["фильтр гидравлики claas", "Фильтр гидравлический", "гидравлический"],
  ])("опечатка «%s» → %s", async (query, expected, fix) => {
    const { names, corrections, mode } = await search(query);
    expect(names[0]).toBe(expected);
    expect(mode).toBe("typos");
    expect(Object.values(corrections).flat()).toContain(fix);
  });

  it.each([
    // Беглая гласная и пропущенная буква в словах из словаря синонимов.
    ["манжта", seal],
    ["клиновые ремни", "Ремень приводной клиновой SPB 2000"],
    ["ремня", "Ремень приводной клиновой SPB 2000"],
  ])("«%s» → %s через словарь", async (query, expected) => {
    const { names } = await search(query);
    expect(names[0]).toBe(expected);
  });

  it("не находит лишнего", async () => {
    expect((await search("насос")).names).toEqual([]);
    expect((await search("гидроцилиндр")).names).toEqual([]); // черновик не публикуется
    expect((await search("сальник")).names[0]).toBe(seal);
  });

  it.each(["...", " . . ", "?!", "—"])("на «%s» ничего не выдаёт", async (query) => {
    const { mode, ids } = await rankProducts(query, 10);
    expect(mode).toBe("exact");
    expect(ids).toEqual([]);
  });

  it("на точный артикул, которого нет, показывает похожие и честно говорит об этом", async () => {
    const { names, mode } = await search("подшипник 6206-2RS");
    expect(mode).toBe("partial");
    expect(names[0]).toBe(bearing);
  });

  it("при равной релевантности выше продавец с хорошей репутацией", async () => {
    const [a, b] = orgIds;
    // У второго предприятия есть успешная сделка с отзывом 5★, у первого нет.
    const twinA = await createProduct(a!, { ...obnalProducts[3]!, name: `Звёздочка ${tag}` });
    const twinB = await createProduct(b!, { ...obnalProducts[3]!, name: `Звёздочка ${tag}` });
    const deal = await db().deal.create({
      data: { sellerId: b!, buyerId: a!, title: "тест", status: "COMPLETED" },
    });
    await db().review.create({
      data: {
        dealId: deal.id,
        authorOrganizationId: a!,
        targetOrganizationId: b!,
        rating: 5,
        text: "тест",
      },
    });
    const { ids: found } = await rankProducts(`звёздочка ${tag}`, 10);
    expect(found.indexOf(twinB.id)).toBeLessThan(found.indexOf(twinA.id));
  });

  it("при равной релевантности выше продавец с тарифом, истёкший тариф не помогает", async () => {
    const [a, b] = orgIds;
    const twinA = await createProduct(a!, { ...obnalProducts[3]!, name: `Шкив ${tag}` });
    const twinB = await createProduct(b!, { ...obnalProducts[3]!, name: `Шкив ${tag}` });
    const rank = async () => {
      const { ids: found } = await rankProducts(`шкив ${tag}`, 10);
      return [found.indexOf(twinA.id), found.indexOf(twinB.id)];
    };
    // Без тарифов выше b (у него отзыв из прошлого теста); Холдинг у a перевешивает отзыв.
    const day = 24 * 60 * 60 * 1000;
    await db().organization.update({
      where: { id: a! },
      data: { plan: "HOLDING", planUntil: new Date(Date.now() + day) },
    });
    const [withPlanA, withPlanB] = await rank();
    expect(withPlanA).toBeLessThan(withPlanB!);
    await db().organization.update({
      where: { id: a! },
      data: { planUntil: new Date(Date.now() - day) },
    });
    const [expiredA, expiredB] = await rank();
    expect(expiredB).toBeLessThan(expiredA!);
  });
});
