// Демо-данные: `npm run db:seed`. Повторный запуск ничего не дублирует.
// Позиции и аккаунты создаются тем же слоем данных, что и на сайте.
import "dotenv/config";
import { hashPassword } from "@/server/auth/password";
import { createProduct, listOrganizationProducts, updateProduct } from "@/server/catalog/products";
import { db } from "@/server/db";
import { createOrder } from "@/server/orders/orders";
import { createOrganization, updateOrganization } from "@/server/organizations/organizations";
import { boostOrder } from "@/server/stars/stars";

/** Пароль обоих демо-аккаунтов. Данные демонстрационные, секрета в них нет. */
const DEMO_PASSWORD = "artel-demo";

const seller = {
  user: { email: "seller@demo.artel", name: "Демо-продавец" },
  organization: {
    name: "ООО Обнал",
    city: "Анкоридж",
    inn: "7700000001",
    description:
      "Производство металлических деталей и узлов для сельхозтехники. Токарная и фрезерная обработка, термообработка, серийные партии от 10 штук.",
    phone: "+7 900 000-00-01",
    email: "sales@obnal.example",
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

const products = [
  {
    name: "Деталь",
    price: "1000000",
    leadTimeDays: 7, // 1 неделя
    city: "Анкоридж",
    status: "PUBLISHED",
  },
] as const;

/** Пользователь-владелец предприятия; если уже есть — обновляем профиль предприятия. */
async function ensureAccount({ user, organization }: typeof seller | typeof buyer) {
  const existingUser = await db().user.findUnique({
    where: { email: user.email },
    select: { memberships: { select: { organizationId: true }, take: 1 } },
  });
  const orgId = existingUser?.memberships[0]?.organizationId;
  if (orgId) {
    await updateOrganization(orgId, organization);
    return orgId;
  }
  // Раньше сид создавал «ООО Обнал» без владельца — подхватываем его.
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

  const current = await listOrganizationProducts(sellerId);
  const productIds: string[] = [];
  for (const product of products) {
    const found = current.find((p) => p.name === product.name);
    const saved = found
      ? await updateProduct(sellerId, found.id, product)
      : await createProduct(sellerId, product);
    productIds.push(saved.id);
  }

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
        quantity: 2,
        unitPrice: products[0].price,
        status: "COMPLETED",
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
          text: "Сделали точно в срок, документы в порядке. Деталь встала без доработки.",
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
        quantity: 5,
        unitPrice: products[0].price,
        comment: "Нужна партия к посевной, доставка в Краснодар.",
      },
    });
  }

  await seedMarket(sellerId, buyerId);

  console.log(
    `Сид: «${seller.organization.name}» и «${buyer.organization.name}». ` +
      `Вход: ${seller.user.email} / ${buyer.user.email}, пароль ${DEMO_PASSWORD}`,
  );
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
    comment: "Нужны такие же для собственного парка техники, доставка в Анкоридж.",
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
      contactEmail: "sales@obnal.example",
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
