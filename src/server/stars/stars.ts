import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/errors";
import { findStarPackage, MAX_BOOST_STARS } from "./packages";
import { paymentProvider } from "./payments";

/**
 * Звёзды: покупка через платёжного провайдера и вложение в заказы.
 * Баланс хранится в `Organization.starBalance` и меняется только здесь, атомарно:
 * списание идёт условием «баланс не меньше суммы», а CHECK в базе не пускает его в минус.
 */

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullish(),
  );

export const boostSchema = z.object({
  stars: z.coerce
    .number({ error: "Сколько звёзд вложить?" })
    .int("Целое число звёзд")
    .min(1, "Хотя бы одна звезда")
    .max(MAX_BOOST_STARS, `За раз — не больше ${MAX_BOOST_STARS}`),
  quantity: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().min(1, "Количество: от 1").max(10_000_000).nullish(),
  ),
  comment: optionalText(1000),
});

export async function getStarBalance(organizationId: string): Promise<number> {
  const org = await db().organization.findUnique({
    where: { id: organizationId },
    select: { starBalance: true },
  });
  return org?.starBalance ?? 0;
}

/**
 * Начать покупку пакета звёзд: запись PENDING и платёж у провайдера.
 * Возвращает адрес страницы оплаты; звёзды зачислит `confirmStarPurchase`.
 */
export async function startStarPurchase(
  organizationId: string,
  userId: string,
  stars: number,
  returnUrl: string,
): Promise<string> {
  const pack = findStarPackage(stars);
  if (!pack) throw new ConflictError("Такого пакета звёзд нет");
  const provider = paymentProvider();
  const purchase = await db().starPurchase.create({
    data: {
      organizationId,
      userId,
      stars: pack.stars,
      amount: pack.price,
      provider: provider.name,
    },
    select: { id: true },
  });
  const payment = await provider.createPayment({
    purchaseId: purchase.id,
    amount: pack.price.toFixed(2),
    description: `Artel: ${pack.stars} зв. для продвижения заказов`,
    returnUrl,
  });
  await db().starPurchase.update({
    where: { id: purchase.id },
    data: { providerPaymentId: payment.paymentId },
  });
  return payment.confirmationUrl;
}

/**
 * Оплата прошла: зачислить звёзды. Повторный вызов (повторное уведомление провайдера)
 * ничего не меняет. Возвращает, были ли звёзды зачислены этим вызовом.
 */
export async function confirmStarPurchase(purchaseId: string): Promise<boolean> {
  return db().$transaction(async (tx) => {
    const purchase = await tx.starPurchase.findUnique({
      where: { id: purchaseId },
      select: { organizationId: true, stars: true },
    });
    if (!purchase) throw new NotFoundError("Платёж не найден");
    const { count } = await tx.starPurchase.updateMany({
      where: { id: purchaseId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (count === 0) return false;
    await tx.organization.update({
      where: { id: purchase.organizationId },
      data: { starBalance: { increment: purchase.stars } },
    });
    return true;
  });
}

/** Покупатель передумал на странице оплаты. */
export async function cancelStarPurchase(organizationId: string, purchaseId: string) {
  await db().starPurchase.updateMany({
    where: { id: purchaseId, organizationId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

/** Покупка для страницы оплаты: только своего предприятия. */
export async function getOwnStarPurchase(organizationId: string, purchaseId: string) {
  const purchase = await db().starPurchase.findFirst({
    where: { id: purchaseId, organizationId },
    select: { id: true, stars: true, amount: true, status: true, provider: true },
  });
  return purchase && { ...purchase, amount: purchase.amount.toFixed(2) };
}

/**
 * Вложить звёзды в открытый заказ. Внутри переданной транзакции, чтобы при размещении заказа
 * звёзды списывались вместе с его созданием.
 */
export async function boostOrderInTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string | null,
  orderId: string,
  input: unknown,
) {
  const { stars, quantity, comment } = boostSchema.parse(input);
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { status: true, customerId: true },
  });
  if (!order) throw new NotFoundError("Заказ не найден");
  if (order.status !== "OPEN") throw new ConflictError("Заказ уже снят с рынка");
  const { count } = await tx.organization.updateMany({
    where: { id: organizationId, starBalance: { gte: stars } },
    data: { starBalance: { decrement: stars } },
  });
  if (count === 0) {
    const exists = await tx.organization.count({ where: { id: organizationId } });
    if (!exists) throw new ForbiddenError("Предприятие не найдено");
    throw new ConflictError("Недостаточно звёзд на счету. Купите пакет и попробуйте снова");
  }
  await tx.orderBoost.create({
    data: {
      orderId,
      organizationId,
      userId,
      stars,
      // Объём заказчика уже записан в самом заказе.
      quantity: order.customerId === organizationId ? null : quantity,
      comment,
    },
  });
  await tx.order.update({ where: { id: orderId }, data: { stars: { increment: stars } } });
}

export async function boostOrder(
  organizationId: string,
  userId: string,
  orderId: string,
  input: unknown,
) {
  await db().$transaction((tx) =>
    boostOrderInTransaction(tx, organizationId, userId, orderId, input),
  );
}

export type StarHistoryEntry = {
  id: string;
  at: Date;
  /** Положительное — пополнение, отрицательное — вложение в заказ. */
  stars: number;
  title: string;
  orderId?: string;
};

/** Пополнения и вложения предприятия, новые сверху. */
export async function listStarHistory(organizationId: string): Promise<StarHistoryEntry[]> {
  const [purchases, boosts] = await Promise.all([
    db().starPurchase.findMany({
      where: { organizationId, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 50,
      select: { id: true, stars: true, amount: true, paidAt: true, createdAt: true },
    }),
    db().orderBoost.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        stars: true,
        createdAt: true,
        order: { select: { id: true, title: true } },
      },
    }),
  ]);
  return [
    ...purchases.map((p) => ({
      id: p.id,
      at: p.paidAt ?? p.createdAt,
      stars: p.stars,
      title: `Покупка пакета за ${Number(p.amount).toLocaleString("ru-RU")} ₽`,
    })),
    ...boosts.map((b) => ({
      id: b.id,
      at: b.createdAt,
      stars: -b.stars,
      title: `Продвижение заказа «${b.order.title}»`,
      orderId: b.order.id,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
}
