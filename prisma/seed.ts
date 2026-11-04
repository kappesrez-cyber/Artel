// Демо-данные: `npm run db:seed`. Повторный запуск ничего не дублирует.
// Позиции и аккаунты создаются тем же слоем данных, что и на сайте.
import "dotenv/config";
import type { Prisma } from "@/generated/prisma/client";
import { isJunkText } from "./junk";
import { hashPassword } from "@/server/auth/password";
import { createProduct, listOrganizationProducts, updateProduct } from "@/server/catalog/products";
import { db } from "@/server/db";
import { createOrder } from "@/server/orders/orders";
import { createOrganization, updateOrganization } from "@/server/organizations/organizations";
import { boostOrder } from "@/server/stars/stars";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { refreshAssessment } from "@/server/assessment/assessment";
import { randomUUID } from "node:crypto";
import { demoSellerProducts, techmashProducts, type DemoProduct } from "./demo-catalog";
import {
  demoCompanies,
  demoCustomers,
  existingCompanyChecks,
  type DemoCompany,
} from "./demo-companies";
import { demoBuyers, demoOrders } from "./demo-orders";
import { demoSellers, sellerProfile } from "./demo-sellers";

/** Пароль обоих демо-аккаунтов. Данные демонстрационные, секрета в них нет. */
const DEMO_PASSWORD = "artel-demo";

const seller = {
  user: { email: "seller@demo.artel", name: "Демо-продавец" },
  organization: {
    name: "ООО «МеталлАгро»",
    city: "Воронеж",
    inn: "7700000001",
    description:
      "Производство металлических деталей и узлов для сельхозтехники. Токарная и фрезерная обработка, термообработка, серийные партии от 10 штук.",
    phone: "+7 900 000-00-01",
    email: "sales@metallagro.example",
    foundedYear: 2012,
    isSeller: true,
    isBuyer: true,
  },
};

const buyer = {
  user: { email: "buyer@demo.artel", name: "Демо-покупатель" },
  organization: {
    name: "АО Агрохолдинг «Заря»",
    city: "Краснодар",
    inn: "2300000002",
    description:
      "Растениеводство и переработка зерна. Ищем замену импортным запчастям для комбайнов.",
    isSeller: false,
    isBuyer: true,
  },
};

const seller2 = {
  user: { email: "seller2@demo.artel", name: "Демо-продавец 2" },
  organization: {
    name: "ООО Техмаш-Юг",
    city: "Ростов-на-Дону",
    inn: "6100000003",
    description:
      "Резинотехнические изделия, приводные ремни, режущие пары для жаток и пищевые ингредиенты для хлебопечения.",
    phone: "+7 900 000-00-03",
    isSeller: true,
    isBuyer: true,
  },
};

type Account = typeof seller | typeof buyer | typeof seller2;

/** Пользователь-владелец предприятия; если уже есть — обновляем профиль предприятия. */
async function ensureAccount({ user, organization }: Account) {
  const existingUser = await db().user.findUnique({
    where: { email: user.email },
    select: { memberships: { select: { organizationId: true }, take: 1 } },
  });
  const orgId = existingUser?.memberships[0]?.organizationId;
  if (orgId) {
    await updateOrganization(orgId, organization);
    return orgId;
  }
  // Раньше сид создавал демо-продавца без владельца — подхватываем его.
  const orphan = await db().organization.findFirst({
    where: { name: organization.name, memberships: { none: {} } },
    select: { id: true },
  });
  const id = orphan
    ? (await updateOrganization(orphan.id, organization)).id
    : (await createOrganization(organization)).id;
  await db().user.create({
    data: {
      ...user,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      memberships: { create: { organizationId: id, role: "OWNER" } },
    },
  });
  return id;
}

async function main() {
  const sellerId = await ensureAccount(seller);
  const buyerId = await ensureAccount(buyer);
  const seller2Id = await ensureAccount(seller2);

  await removeJunk(sellerId);
  const productIds = await ensureProducts(sellerId, demoSellerProducts);
  await ensureProducts(seller2Id, techmashProducts);
  // Второй продавец на тарифе Про: видно бейдж, комиссию 5% и подъём в поиске.
  await db().organization.updateMany({
    where: { id: seller2Id, plan: "FREE" },
    data: { plan: "PRO", planUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  });
  const products = demoSellerProducts;

  if ((await db().organizationDocument.count({ where: { organizationId: sellerId } })) === 0) {
    await db().organizationDocument.createMany({
      data: [
        {
          organizationId: sellerId,
          kind: "CERTIFICATE",
          title: "Декларация соответствия ТР ТС 010/2011",
          number: "ЕАЭС N RU Д-RU.00000",
          issuedAt: new Date("2025-03-01"),
          validUntil: new Date("2030-03-01"),
        },
        {
          organizationId: sellerId,
          kind: "FINANCIAL_REPORT",
          title: "Бухгалтерская отчётность за 2025 год",
          issuedAt: new Date("2026-03-31"),
        },
      ],
    });
  }

  // Одна успешная сделка с отзывами обеих сторон и одна новая — чтобы было что нажать.
  if ((await db().deal.count({ where: { sellerId, buyerId } })) === 0) {
    const completed = await db().deal.create({
      data: {
        sellerId,
        buyerId,
        productId: productIds[0],
        title: products[0].name,
        quantity: 200,
        unitPrice: products[0].price,
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 24 * 86_400_000),
        acceptedAt: new Date(Date.now() - 20 * 86_400_000),
        completedAt: new Date(Date.now() - 10 * 86_400_000),
      },
    });
    await db().review.createMany({
      data: [
        {
          dealId: completed.id,
          authorOrganizationId: buyerId,
          targetOrganizationId: sellerId,
          rating: 5,
          text: "Сделали точно в срок, документы в порядке. Подшипники встали без доработки.",
        },
        {
          dealId: completed.id,
          authorOrganizationId: sellerId,
          targetOrganizationId: buyerId,
          rating: 5,
          text: "Чёткое ТЗ и быстрая оплата.",
        },
      ],
    });
    await db().deal.create({
      data: {
        sellerId,
        buyerId,
        productId: productIds[0],
        title: products[0].name,
        quantity: 500,
        unitPrice: products[0].price,
        comment: "Нужна партия к посевной, доставка в Краснодар.",
      },
    });
  }

  await seedMarket(sellerId, buyerId);
  await seedAnalytics(sellerId, seller2Id, buyerId);
  await seedSeller2Deals(seller2Id, buyerId);
  const customerIds = await seedDemoCompanies(buyerId);
  await seedDemoOrders(customerIds);
  await seedCatalogQueries(customerIds);

  console.log(
    `Сид: «${seller.organization.name}», «${seller2.organization.name}» и «${buyer.organization.name}». ` +
      `Вход: ${seller.user.email} / ${buyer.user.email} / ${seller2.user.email}, пароль ${DEMO_PASSWORD}`,
  );
}

/**
 * Демо-производители с разной репутацией, их логотипы и ИИ-сводки, плюс расширенный
 * ассортимент (`demo-sellers.ts`). Предприятия и позиции обновляются при каждом запуске,
 * история сделок и документы создаются один раз. Возвращает id заказчиков: Заря и демо-заказчики.
 */
async function seedDemoCompanies(buyerId: string): Promise<string[]> {
  const customerIds = [buyerId];
  for (const customer of [...demoCustomers, ...demoBuyers]) {
    const found = await db().organization.findUnique({ where: { inn: customer.inn } });
    customerIds.push(
      found?.id ?? (await createOrganization({ ...customer, isSeller: false, isBuyer: true })).id,
    );
  }

  const companies: { id: string; logo?: string; company: Partial<DemoCompany> }[] = [];
  const upsert = async (organization: DemoCompany["organization"], products: DemoProduct[]) => {
    const found = await db().organization.findUnique({ where: { inn: organization.inn } });
    const id = found
      ? (await updateOrganization(found.id, organization)).id
      : (await createOrganization(organization)).id;
    await ensureProducts(id, products);
    return id;
  };
  for (const company of demoCompanies) {
    const id = await upsert(company.organization, company.products);
    companies.push({ id, logo: company.logo, company });
  }
  for (const [i, seller] of demoSellers.entries()) {
    const company = sellerProfile(seller, i);
    const id = await upsert(company.organization, company.products);
    companies.push({ id, company });
  }
  for (const [name, extra] of Object.entries(existingCompanyChecks)) {
    const found = await db().organization.findFirst({ where: { name }, select: { id: true } });
    if (!found) continue;
    if (extra.foundedYear) {
      await db().organization.update({
        where: { id: found.id },
        data: { foundedYear: extra.foundedYear },
      });
    }
    companies.push({ id: found.id, logo: extra.logo, company: extra });
  }

  for (const { id, logo, company } of companies) {
    if (company.verified) {
      await db().organization.updateMany({
        where: { id, verifiedAt: null },
        data: { verifiedAt: new Date("2026-09-01") },
      });
    }
    if (company.documents?.length) {
      const existing = await db().organizationDocument.findMany({
        where: { organizationId: id },
        select: { title: true },
      });
      const titles = new Set(existing.map((d) => d.title));
      await db().organizationDocument.createMany({
        data: company.documents
          .filter((doc) => !titles.has(doc.title))
          .map((doc) => ({ ...doc, organizationId: id, issuedAt: new Date(doc.issuedAt) })),
      });
    }
    if (company.reputation) await seedReputation(id, customerIds, company.reputation);
    if (logo) {
      const data = readFileSync(join(import.meta.dirname, "demo-logos", logo));
      await db().organizationLogo.upsert({
        where: { organizationId: id },
        create: { organizationId: id, mimeType: "image/png", size: data.byteLength, data },
        update: {},
      });
    }
    await refreshAssessment(id, company.external ?? {});
  }
  // Остальным — сводка только по данным платформы.
  for (const { id } of await db().organization.findMany({ select: { id: true } })) {
    if (!companies.some((c) => c.id === id)) await refreshAssessment(id);
  }
  return customerIds;
}

/** История сделок производителя с демо-заказчиками за последние два года. Один раз. */
async function seedReputation(
  sellerId: string,
  customerIds: string[],
  spec: NonNullable<DemoCompany["reputation"]>,
) {
  const customers = customerIds.slice(1);
  if ((await db().deal.count({ where: { sellerId, buyerId: { in: customers } } })) > 0) return;
  const products = await db().product.findMany({
    where: { organizationId: sellerId, status: "PUBLISHED" },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  });
  if (products.length === 0) return;
  const day = 86_400_000;
  const total = spec.completed + spec.cancelled;
  // Сорванные сделки равномерно среди завершённых.
  const cancelledAt = new Set(
    Array.from({ length: spec.cancelled }, (_, i) =>
      Math.floor(((i + 0.5) * total) / Math.max(1, spec.cancelled)),
    ),
  );
  // Заказчики у каждого производителя свои: сдвиг по id, чтобы не у всех был один и тот же.
  const shift = [...sellerId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const deals: Prisma.DealCreateManyInput[] = [];
  const reviews: Prisma.ReviewCreateManyInput[] = [];
  let n = 0;
  for (let i = 0; i < total; i++) {
    const product = products[i % products.length]!;
    const buyerId = customers[(i + shift) % customers.length]!;
    const createdAt = new Date(Date.now() - Math.round(((total - i) / total) * 700 + 12) * day);
    const cancelled = cancelledAt.has(i);
    const id = randomUUID();
    deals.push({
      id,
      sellerId,
      buyerId,
      productId: product.id,
      title: product.name,
      quantity: 20 + ((i * 37) % 400),
      unitPrice: product.price,
      status: cancelled ? "CANCELLED" : "COMPLETED",
      createdAt,
      acceptedAt: new Date(createdAt.getTime() + day),
      completedAt: cancelled ? null : new Date(createdAt.getTime() + 9 * day),
      cancelledAt: cancelled ? new Date(createdAt.getTime() + 20 * day) : null,
    });
    if (!cancelled) {
      reviews.push({
        dealId: id,
        authorOrganizationId: buyerId,
        targetOrganizationId: sellerId,
        rating: spec.ratings[n % spec.ratings.length]!,
        text: spec.reviews[n % spec.reviews.length]!,
        createdAt: new Date(createdAt.getTime() + 10 * day),
      });
      n++;
    }
  }
  await db().deal.createMany({ data: deals });
  await db().review.createMany({ data: reviews });
}

/**
 * Заказы демо-заказчиков на рынке (`demo-orders.ts`). Заказ с тем же названием у того же
 * заказчика не создаётся второй раз, поэтому новые заказы из списка добавляются и в старую базу.
 */
async function seedDemoOrders(customerIds: string[]) {
  const buyers = customerIds.slice(1 + demoCustomers.length);
  const day = 86_400_000;
  for (const [i, order] of demoOrders.entries()) {
    const customerId = buyers[order.buyer];
    if (!customerId) continue;
    if (
      await db().order.findFirst({
        where: { customerId, title: order.title },
        select: { id: true },
      })
    )
      continue;
    const createdAt = new Date(Date.now() - ((i * 13) % 28) * day - ((i * 7) % 20) * 3_600_000);
    const contact = demoBuyers[order.buyer]!;
    await db().order.create({
      data: {
        customerId,
        title: order.title,
        description: order.description,
        specification: order.specification ?? null,
        quantity: order.quantity,
        unit: order.unit ?? "шт.",
        budget: order.budget ?? null,
        deadline: order.deadlineDays ? new Date(Date.now() + order.deadlineDays * day) : null,
        city: contact.city,
        needKind: order.needKind,
        originalBrand: order.original?.[0] ?? null,
        originalArticle: order.original?.[1] ?? null,
        application: order.application ?? null,
        industry: order.industry,
        analogAllowed: order.needKind === "IMPORT_REPLACEMENT",
        recurrence: order.recurrence ?? "ONCE",
        requiredDocuments:
          order.industry === "Пищевая промышленность"
            ? ["Сертификат соответствия", "Декларация ХАССП"]
            : ["Паспорт качества"],
        contactName: "Отдел снабжения",
        contactPhone: `+7 900 ${String(300 + order.buyer).padStart(3, "0")}-00-${String(10 + order.buyer).padStart(2, "0")}`,
        stars: order.stars ?? 0,
        createdAt,
        ...(order.stars && {
          boosts: { create: { organizationId: customerId, stars: order.stars, createdAt } },
        }),
      },
    });
  }
}

/**
 * Убрать мусор: старое название демо-продавца, позицию «Деталь» за миллион и карточки или
 * заказы, которые заводили «для проверки» («тест», «asdf», «123»…). Повторный запуск безопасен.
 */
async function removeJunk(sellerId: string) {
  // Демо-сделки по «Детали» пересоздадутся ниже уже по подшипнику.
  await db().deal.deleteMany({ where: { sellerId, title: "Деталь" } });
  await db().orderBoost.updateMany({
    where: { comment: { contains: "Анкоридж" } },
    data: { comment: "Нужны такие же для собственного парка техники, доставка в Воронеж." },
  });
  await db().order.updateMany({
    where: { contactEmail: "sales@obnal.example" },
    data: { contactEmail: "sales@metallagro.example" },
  });

  const products = await db().product.findMany({ select: { id: true, name: true } });
  const junkProducts = products.filter((p) => p.name.trim() === "Деталь" || isJunkText(p.name));
  if (junkProducts.length) {
    await db().product.deleteMany({ where: { id: { in: junkProducts.map((p) => p.id) } } });
    console.log(`Удалены тестовые позиции: ${junkProducts.map((p) => `«${p.name}»`).join(", ")}`);
  }
  const orders = await db().order.findMany({
    select: { id: true, title: true, description: true },
  });
  const junkOrders = orders.filter((o) => isJunkText(o.title) || isJunkText(o.description));
  if (junkOrders.length) {
    await db().order.deleteMany({ where: { id: { in: junkOrders.map((o) => o.id) } } });
    console.log(`Удалены тестовые заказы: ${junkOrders.map((o) => `«${o.title}»`).join(", ")}`);
  }
}

/** Сделки второго продавца: чтобы у него тоже была репутация и выручка в аналитике. Один раз. */
async function seedSeller2Deals(sellerId: string, buyerId: string) {
  if ((await db().deal.count({ where: { sellerId } })) > 0) return;
  const products = await db().product.findMany({
    where: { organizationId: sellerId, status: "PUBLISHED" },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  });
  const day = 86_400_000;
  const plan = [
    {
      quantity: 400,
      daysAgo: 27,
      rating: 5,
      text: "Сравнили с импортным оригиналом — не хуже, документы в порядке.",
    },
    { quantity: 30, daysAgo: 16, rating: 4, text: "Хорошее качество, отгрузили на два дня позже." },
    { quantity: 1500, daysAgo: 6, rating: null, text: null },
  ];
  for (const [i, step] of plan.entries()) {
    const product = products[i % products.length];
    if (!product) return;
    const createdAt = new Date(Date.now() - step.daysAgo * day);
    const done = step.rating !== null;
    const deal = await db().deal.create({
      data: {
        sellerId,
        buyerId,
        productId: product.id,
        title: product.name,
        quantity: step.quantity,
        unitPrice: product.price,
        status: done ? "COMPLETED" : "ACCEPTED",
        createdAt,
        acceptedAt: new Date(createdAt.getTime() + day),
        completedAt: done ? new Date(createdAt.getTime() + 5 * day) : null,
      },
    });
    if (done) {
      await db().review.create({
        data: {
          dealId: deal.id,
          authorOrganizationId: buyerId,
          targetOrganizationId: sellerId,
          rating: step.rating!,
          text: step.text!,
        },
      });
    }
  }
}

/** Позиции предприятия по названию: новые создаём, существующие обновляем. */
async function ensureProducts(organizationId: string, list: DemoProduct[]): Promise<string[]> {
  const current = await listOrganizationProducts(organizationId);
  const ids: string[] = [];
  for (const { photos, ...product } of list) {
    const found = current.find((p) => p.name === product.name);
    const saved = found
      ? await updateProduct(organizationId, found.id, product)
      : await createProduct(organizationId, product);
    ids.push(saved.id);
    if (photos?.length) await ensurePhotos(saved.id, photos);
  }
  return ids;
}

/** Демо-снимки позиции, если у неё ещё нет ни одного: свои фото продавца не трогаем. */
async function ensurePhotos(productId: string, files: string[]) {
  if ((await db().photo.count({ where: { productId } })) > 0) return;
  await db().photo.createMany({
    data: files.map((file, position) => {
      const data = readFileSync(join(import.meta.dirname, "demo-photos", file));
      return { productId, mimeType: "image/jpeg", size: data.byteLength, data, position };
    }),
  });
}

/**
 * История поиска и просмотров за последние 30 дней, чтобы раздел «Аналитика» было с чем
 * открыть. Псевдослучайно, но одинаково при каждом запуске. Один раз.
 */
async function seedAnalytics(sellerId: string, seller2Id: string, buyerId: string) {
  if ((await db().searchQuery.count()) > 0) return;
  let seed = 42;
  const random = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
    return seed / 2 ** 31;
  };
  const published = await db().product.findMany({
    where: { organizationId: { in: [sellerId, seller2Id] }, status: "PUBLISHED" },
    select: { id: true, name: true },
  });
  const pick = (word: string) => published.filter((p) => p.name.toLowerCase().includes(word));
  // Запрос → какие позиции он находит. Пустой список — спрос, который каталог пока не закрывает.
  const queries: [string, { id: string }[]][] = [
    ["подшипник 6205", pick("подшипник")],
    ["подшипник для комбайна", pick("подшипник")],
    ["SKF 6205-2RSH", pick("подшипник")],
    ["сальник 45х65", pick("манжета")],
    ["ремень SPB 2000", pick("ремень")],
    ["сегмент ножа жатки", pick("сегмент")],
    ["вал жатки claas", pick("вал")],
    ["цепь приводная", pick("цепь")],
    ["амилаза", pick("амилаза")],
    ["фильтр гидравлический claas", pick("фильтр")],
    ["форсунка common rail", []],
    ["датчик скорости вращения", []],
    ["гидромотор шнека", []],
    ["закваска для сыра", []],
  ];
  const day = 86_400_000;
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const count = 2 + Math.floor(random() * 5);
    for (let i = 0; i < count; i++) {
      const [query, found] = queries[Math.floor(random() * queries.length)]!;
      const createdAt = new Date(Date.now() - daysAgo * day - Math.floor(random() * day));
      const search = await db().searchQuery.create({
        data: {
          query,
          normalized: query
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .trim(),
          resultsCount: found.length,
          viewerOrganizationId: random() < 0.6 ? buyerId : null,
          createdAt,
        },
      });
      await db().productEvent.createMany({
        data: found.flatMap((p) => [
          { productId: p.id, kind: "IMPRESSION" as const, searchQueryId: search.id, createdAt },
          ...(random() < 0.45
            ? [{ productId: p.id, kind: "VIEW" as const, viewerOrganizationId: buyerId, createdAt }]
            : []),
        ]),
      });
    }
  }
}

/**
 * Поисковые запросы по расширенному ассортименту (плуги, гидравлика, ферменты…), чтобы
 * «Аналитика» и популярные запросы отражали весь каталог. Один раз: по запросу «плуг оборотный».
 */
async function seedCatalogQueries(buyerIds: string[]) {
  const marker = "плуг оборотный";
  if ((await db().searchQuery.count({ where: { normalized: marker } })) > 0) return;
  let seed = 7;
  const random = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
    return seed / 2 ** 31;
  };
  const published = await db().product.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true },
  });
  const pick = (word: string) =>
    published.filter((p) => p.name.toLowerCase().includes(word)).slice(0, 9);
  const queries: [string, { id: string }[]][] = [
    [marker, pick("плуг оборотный")],
    ["плуг lemken аналог", pick("плуг")],
    ["лемех плуга", pick("лемех")],
    ["отвал плуга", pick("отвал")],
    ["диск бороны", pick("диск")],
    ["гидроцилиндр навески", pick("гидроцилиндр")],
    ["насос НШ-32", pick("насос")],
    ["рвд 2sn", pick("рукав")],
    ["подшипник 22212", pick("подшипник")],
    ["манжета 50х72", pick("манжета")],
    ["ремень вариаторный", pick("ремень")],
    ["вал шлицевой", pick("вал")],
    ["закваска для сыра", pick("закваска")],
    ["лактаза", pick("лактаза")],
    ["дрожжи сухие", pick("дрожжи")],
    ["фильтр масляный", pick("фильтр")],
    ["форсунка common rail", pick("форсунка")],
    ["датчик скорости вращения", pick("датчик")],
    ["частотный преобразователь", pick("преобразователь")],
    ["культиватор лапа", pick("лапа")],
    ["сеялка высевающий диск", pick("высевающий")],
    ["пищевой насос", pick("насос")],
  ];
  const day = 86_400_000;
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const count = 4 + Math.floor(random() * 8);
    for (let i = 0; i < count; i++) {
      const [query, found] = queries[Math.floor(random() * queries.length)]!;
      const createdAt = new Date(Date.now() - daysAgo * day - Math.floor(random() * day));
      const viewer = random() < 0.6 ? buyerIds[Math.floor(random() * buyerIds.length)]! : null;
      const search = await db().searchQuery.create({
        data: {
          query,
          normalized: query
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .trim(),
          resultsCount: found.length,
          viewerOrganizationId: viewer,
          createdAt,
        },
      });
      await db().productEvent.createMany({
        data: found.flatMap((p) => [
          { productId: p.id, kind: "IMPRESSION" as const, searchQueryId: search.id, createdAt },
          ...(viewer && random() < 0.35
            ? [{ productId: p.id, kind: "VIEW" as const, viewerOrganizationId: viewer, createdAt }]
            : []),
        ]),
      });
    }
  }
}

/** Заказы на рынке и звёзды: чтобы в режиме «Продавцам» было что открыть. Один раз. */
async function seedMarket(sellerId: string, buyerId: string) {
  if ((await db().order.count()) > 0) return;
  const userOf = async (organizationId: string) =>
    (
      await db().membership.findFirstOrThrow({
        where: { organizationId },
        select: { userId: true },
      })
    ).userId;
  const [sellerUser, buyerUser] = await Promise.all([userOf(sellerId), userOf(buyerId)]);
  // Стартовые звёзды демо-аккаунтов: часть уйдёт в заказы ниже, остальное — попробовать самому.
  await db().organization.updateMany({
    where: { id: { in: [sellerId, buyerId] } },
    data: { starBalance: { increment: 20 } },
  });

  const contacts = { contactName: "Демо-покупатель", contactPhone: "+7 900 000-00-02" };
  const bearing = await createOrder(
    buyerId,
    buyerUser,
    {
      title: "Подшипник 6205-2RS для комбайна",
      description:
        "Замена импортному подшипнику SKF в приводе жатки. Нужна партия к посевной, с паспортом качества.",
      specification:
        "Внутренний диаметр 25 мм, наружный 52 мм, ширина 15 мм.\nДвустороннее резиновое уплотнение 2RS.\nКласс точности не ниже 0 (ГОСТ 520-2011).",
      quantity: "200",
      budget: "180000",
      deadline: new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10),
      city: "Краснодар",
      stars: "5",
      ...contacts,
    },
    [],
  );
  await boostOrder(sellerId, sellerUser, bearing.id, {
    stars: 3,
    quantity: 120,
    comment: "Нужны такие же для собственного парка техники, доставка в Воронеж.",
  });
  await createOrder(
    buyerId,
    buyerUser,
    {
      title: "Манжеты для гидроцилиндров погрузчика",
      description:
        "Ищем отечественного производителя манжет взамен импортных, поставки раз в квартал.",
      quantity: "500",
      city: "Краснодар",
      ...contacts,
    },
    [],
  );
  await createOrder(
    sellerId,
    sellerUser,
    {
      title: "Ферментный препарат для хлебопечения",
      description: "Нужен аналог импортной амилазы для линии производства хлеба.",
      specification: "Активность не ниже 10 000 ед./г, сертификат ХАССП.",
      quantity: "50",
      unit: "кг",
      budget: "350000",
      stars: "2",
      contactName: "Демо-продавец",
      contactEmail: "sales@metallagro.example",
    },
    [],
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
