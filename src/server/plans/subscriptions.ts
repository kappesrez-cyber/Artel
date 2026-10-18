import "server-only";
import type { PlanTier } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { ConflictError, NotFoundError } from "@/server/errors";
import { paymentProvider } from "@/server/stars/payments";
import { effectiveTier, getPlan, nextPlanUntil } from "./plans";

/**
 * Подписка на тариф: оплата месяца через того же платёжного провайдера, что у звёзд
 * (пока тестовая заглушка), продление срока и бонусные звёзды.
 */

export type OrganizationPlan = {
  /** Действующий тариф с учётом срока. */
  tier: PlanTier;
  /** До какого момента оплачен; у Free — null. */
  until: Date | null;
};

export async function getOrganizationPlan(organizationId: string): Promise<OrganizationPlan> {
  const org = await db().organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, planUntil: true },
  });
  if (!org) return { tier: "FREE", until: null };
  const tier = effectiveTier(org);
  return { tier, until: tier === "FREE" ? null : org.planUntil };
}

/** Начать оплату месяца тарифа. Возвращает адрес страницы оплаты. */
export async function startPlanPurchase(
  organizationId: string,
  userId: string,
  tier: PlanTier,
  returnUrl: string,
): Promise<string> {
  const plan = getPlan(tier);
  if (plan.price <= 0) throw new ConflictError("Этот тариф не нужно оплачивать");
  const provider = paymentProvider();
  const purchase = await db().planPurchase.create({
    data: { organizationId, userId, plan: tier, amount: plan.price, provider: provider.name },
    select: { id: true },
  });
  const payment = await provider.createPayment({
    kind: "plan",
    purchaseId: purchase.id,
    amount: plan.price.toFixed(2),
    description: `Artel: тариф ${plan.name} на месяц`,
    returnUrl,
  });
  await db().planPurchase.update({
    where: { id: purchase.id },
    data: { providerPaymentId: payment.paymentId },
  });
  return payment.confirmationUrl;
}

/**
 * Оплата прошла: включить тариф и зачислить бонусные звёзды. Повторный вызов ничего не
 * меняет. Возвращает, был ли платёж проведён этим вызовом.
 */
export async function confirmPlanPurchase(purchaseId: string): Promise<boolean> {
  return db().$transaction(async (tx) => {
    const purchase = await tx.planPurchase.findUnique({
      where: { id: purchaseId },
      select: { organizationId: true, plan: true },
    });
    if (!purchase) throw new NotFoundError("Платёж не найден");
    const { count } = await tx.planPurchase.updateMany({
      where: { id: purchaseId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (count === 0) return false;
    const org = await tx.organization.findUniqueOrThrow({
      where: { id: purchase.organizationId },
      select: { plan: true, planUntil: true },
    });
    await tx.organization.update({
      where: { id: purchase.organizationId },
      data: {
        plan: purchase.plan,
        planUntil: nextPlanUntil(org, purchase.plan),
        starBalance: { increment: getPlan(purchase.plan).bonusStars },
      },
    });
    return true;
  });
}

export async function cancelPlanPurchase(organizationId: string, purchaseId: string) {
  await db().planPurchase.updateMany({
    where: { id: purchaseId, organizationId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

/** Оплата тарифа для страницы оплаты: только своего предприятия. */
export async function getOwnPlanPurchase(organizationId: string, purchaseId: string) {
  const purchase = await db().planPurchase.findFirst({
    where: { id: purchaseId, organizationId },
    select: { id: true, plan: true, amount: true, status: true, provider: true },
  });
  return purchase && { ...purchase, amount: purchase.amount.toFixed(2) };
}

/** Оплаченные месяцы тарифов, новые сверху. */
export async function listPlanPayments(organizationId: string) {
  return db().planPurchase.findMany({
    where: { organizationId, status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: 24,
    select: { id: true, plan: true, amount: true, paidAt: true },
  });
}
