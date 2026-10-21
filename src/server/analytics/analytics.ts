import "server-only";
import { db } from "@/server/db";
import { fillDays, ratingHistogram, type DayPoint, type PeriodDays } from "./metrics";

/**
 * Отчёты для раздела «Аналитика» личного кабинета. Всё считается по данным платформы:
 * показы и просмотры (`ProductEvent`), запросы в поиске (`SearchQuery`), сделки, отзывы,
 * заказы на рынке и звёзды. Каждая цифра — за выбранный период и за такой же период до него.
 */

const DAY = 86_400_000;

type Count = { n: number };

export type SellerAnalytics = Awaited<ReturnType<typeof getSellerAnalytics>>;
export type BuyerAnalytics = Awaited<ReturnType<typeof getBuyerAnalytics>>;
export type MarketAnalytics = Awaited<ReturnType<typeof getMarketAnalytics>>;

/** Продавец: спрос на позиции, воронка от показа до сделки, выручка, запросы, репутация. */
export async function getSellerAnalytics(organizationId: string, days: PeriodDays) {
  const now = Date.now();
  const from = new Date(now - days * DAY);
  const prevFrom = new Date(now - 2 * days * DAY);

  const events = (kind: "IMPRESSION" | "VIEW", start: Date, end: Date) =>
    db().productEvent.count({
      where: { kind, product: { organizationId }, createdAt: { gte: start, lt: end } },
    });
  const nowDate = new Date(now);

  const [
    impressions,
    impressionsPrev,
    views,
    viewsPrev,
    dailyViews,
    dailyImpressions,
    deals,
    dealsPrev,
    products,
    queries,
    ratings,
    recentRating,
  ] = await Promise.all([
    events("IMPRESSION", from, nowDate),
    events("IMPRESSION", prevFrom, from),
    events("VIEW", from, nowDate),
    events("VIEW", prevFrom, from),
    daily(organizationId, "VIEW", from),
    daily(organizationId, "IMPRESSION", from),
    dealFunnel(organizationId, from, nowDate),
    dealFunnel(organizationId, prevFrom, from),
    productTable(organizationId, from),
    db().$queryRaw<{ query: string; n: number; views: number }[]>`
      SELECT min(sq.query) AS query, count(DISTINCT sq.id)::int AS n,
        count(DISTINCT sq.id) FILTER (WHERE EXISTS (
          SELECT 1 FROM "ProductEvent" v
          WHERE v."productId" = e."productId" AND v.kind = 'VIEW'
            AND v."createdAt" BETWEEN sq."createdAt" AND sq."createdAt" + interval '1 hour'
        ))::int AS views
      FROM "SearchQuery" sq
      JOIN "ProductEvent" e ON e."searchQueryId" = sq.id AND e.kind = 'IMPRESSION'
      JOIN "Product" p ON p.id = e."productId" AND p."organizationId" = ${organizationId}
      WHERE sq."createdAt" >= ${from}
      GROUP BY sq.normalized
      ORDER BY n DESC, query
      LIMIT 8`,
    db().$queryRaw<{ rating: number; count: number }[]>`
      SELECT rating, count(*)::int AS count FROM "Review"
      WHERE "targetOrganizationId" = ${organizationId}
      GROUP BY rating`,
    db().review.aggregate({
      where: { targetOrganizationId: organizationId, createdAt: { gte: from } },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const histogram = ratingHistogram(ratings);
  const reviews = histogram.reduce((a, b) => a + b, 0);
  const average = reviews
    ? Math.round((histogram.reduce((sum, c, i) => sum + c * (i + 1), 0) / reviews) * 10) / 10
    : null;

  return {
    impressions,
    impressionsPrev,
    views,
    viewsPrev,
    dailyViews,
    dailyImpressions,
    deals,
    dealsPrev,
    products,
    queries,
    reputation: {
      histogram,
      reviews,
      average,
      periodReviews: recentRating._count,
      periodAverage:
        recentRating._avg.rating === null ? null : Math.round(recentRating._avg.rating * 10) / 10,
    },
  };
}

async function daily(
  organizationId: string,
  kind: "IMPRESSION" | "VIEW",
  from: Date,
): Promise<DayPoint[]> {
  const rows = await db().$queryRaw<DayPoint[]>`
    SELECT to_char(e."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD') AS day,
      count(*)::int AS value
    FROM "ProductEvent" e JOIN "Product" p ON p.id = e."productId"
    WHERE p."organizationId" = ${organizationId} AND e.kind = ${kind}::"ProductEventKind"
      AND e."createdAt" >= ${from}
    GROUP BY day`;
  return fillDays(rows, Math.round((Date.now() - from.getTime()) / DAY));
}

/** Сделки, где предприятие продаёт, созданные в периоде: сколько дошло до каждого шага и на какую сумму. */
async function dealFunnel(organizationId: string, from: Date, to: Date) {
  const [row] = await db().$queryRaw<
    {
      requested: number;
      accepted: number;
      completed: number;
      revenue: number;
      days: number | null;
    }[]
  >`
    SELECT count(*)::int AS requested,
      count(*) FILTER (WHERE "acceptedAt" IS NOT NULL)::int AS accepted,
      count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
      coalesce(sum(quantity * "unitPrice") FILTER (WHERE status = 'COMPLETED'), 0)::float AS revenue,
      avg(extract(epoch FROM "completedAt" - "createdAt") / 86400)
        FILTER (WHERE status = 'COMPLETED')::float AS days
    FROM "Deal"
    WHERE "sellerId" = ${organizationId} AND "createdAt" >= ${from} AND "createdAt" < ${to}`;
  return {
    requested: row?.requested ?? 0,
    accepted: row?.accepted ?? 0,
    completed: row?.completed ?? 0,
    revenue: row?.revenue ?? 0,
    /** Средний срок от предложения до успешного завершения, дней. */
    averageDays: row?.days == null ? null : Math.round(row.days),
  };
}

/** Позиции продавца с показами, просмотрами, сделками и выручкой за период. */
async function productTable(organizationId: string, from: Date) {
  return db().$queryRaw<
    {
      id: string;
      name: string;
      status: string;
      impressions: number;
      views: number;
      deals: number;
      revenue: number;
    }[]
  >`
    SELECT p.id, p.name, p.status::text AS status,
      (SELECT count(*) FROM "ProductEvent" e
        WHERE e."productId" = p.id AND e.kind = 'IMPRESSION' AND e."createdAt" >= ${from})::int AS impressions,
      (SELECT count(*) FROM "ProductEvent" e
        WHERE e."productId" = p.id AND e.kind = 'VIEW' AND e."createdAt" >= ${from})::int AS views,
      (SELECT count(*) FROM "Deal" d
        WHERE d."productId" = p.id AND d."createdAt" >= ${from})::int AS deals,
      (SELECT coalesce(sum(d.quantity * d."unitPrice"), 0) FROM "Deal" d
        WHERE d."productId" = p.id AND d.status = 'COMPLETED' AND d."completedAt" >= ${from})::float AS revenue
    FROM "Product" p
    WHERE p."organizationId" = ${organizationId} AND p.status <> 'ARCHIVED'
    ORDER BY impressions DESC, views DESC, p.name
    LIMIT 20`;
}

/** Покупатель: закупки, траты, заказы на рынке и вложенные звёзды. */
export async function getBuyerAnalytics(organizationId: string, days: PeriodDays) {
  const from = new Date(Date.now() - days * DAY);
  const [purchases, orders, boosts, balance, searches] = await Promise.all([
    db().$queryRaw<{ deals: number; completed: number; spent: number; sellers: number }[]>`
      SELECT count(*)::int AS deals,
        count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
        coalesce(sum(quantity * "unitPrice") FILTER (WHERE status = 'COMPLETED'), 0)::float AS spent,
        count(DISTINCT "sellerId") FILTER (WHERE status = 'COMPLETED')::int AS sellers
      FROM "Deal" WHERE "buyerId" = ${organizationId} AND "createdAt" >= ${from}`,
    db().$queryRaw<{ placed: number; open: number; supporters: number; stars: number }[]>`
      SELECT count(*)::int AS placed,
        count(*) FILTER (WHERE o.status = 'OPEN')::int AS open,
        (SELECT count(DISTINCT b."organizationId") FROM "OrderBoost" b JOIN "Order" oo ON oo.id = b."orderId"
          WHERE oo."customerId" = ${organizationId} AND b."organizationId" <> ${organizationId})::int AS supporters,
        coalesce(sum(o.stars), 0)::int AS stars
      FROM "Order" o WHERE o."customerId" = ${organizationId} AND o."createdAt" >= ${from}`,
    db().orderBoost.aggregate({
      where: { organizationId, createdAt: { gte: from } },
      _sum: { stars: true },
    }),
    db().organization.findUnique({ where: { id: organizationId }, select: { starBalance: true } }),
    db().$queryRaw<Count[]>`
      SELECT count(*)::int AS n FROM "SearchQuery"
      WHERE "viewerOrganizationId" = ${organizationId} AND "createdAt" >= ${from}`,
  ]);
  return {
    ...(purchases[0] ?? { deals: 0, completed: 0, spent: 0, sellers: 0 }),
    orders: orders[0] ?? { placed: 0, open: 0, supporters: 0, stars: 0 },
    starsInvested: boosts._sum.stars ?? 0,
    starBalance: balance?.starBalance ?? 0,
    searches: searches[0]?.n ?? 0,
  };
}

/**
 * Рынок замещения по всей платформе: что ищут и не находят, и самые продвигаемые заказы.
 * Подсказка производителю, какие позиции стоит добавить в каталог.
 */
export async function getMarketAnalytics(organizationId: string, days: PeriodDays) {
  const from = new Date(Date.now() - days * DAY);
  const [unmet, searches, topOrders, openOrders] = await Promise.all([
    db().$queryRaw<{ query: string; n: number; last: Date }[]>`
      SELECT min(query) AS query, count(*)::int AS n, max("createdAt") AS last
      FROM "SearchQuery"
      WHERE "resultsCount" = 0 AND "createdAt" >= ${from}
      GROUP BY normalized
      ORDER BY n DESC, last DESC
      LIMIT 8`,
    db().$queryRaw<{ total: number; empty: number }[]>`
      SELECT count(*)::int AS total, count(*) FILTER (WHERE "resultsCount" = 0)::int AS empty
      FROM "SearchQuery" WHERE "createdAt" >= ${from}`,
    db().order.findMany({
      where: { status: "OPEN", customerId: { not: organizationId } },
      orderBy: [{ stars: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, stars: true, quantity: true, unit: true, city: true },
    }),
    db().order.aggregate({ where: { status: "OPEN" }, _count: true, _sum: { stars: true } }),
  ]);
  return {
    unmet,
    searches: searches[0]?.total ?? 0,
    emptySearches: searches[0]?.empty ?? 0,
    topOrders,
    openOrders: openOrders._count,
    openOrderStars: openOrders._sum.stars ?? 0,
  };
}
