"use server";

import { redirect } from "next/navigation";
import { routes } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { safeNext } from "@/server/forms";
import { plans } from "@/server/plans/plans";
import {
  cancelPlanPurchase,
  confirmPlanPurchase,
  getOwnPlanPurchase,
  startPlanPurchase,
} from "@/server/plans/subscriptions";
import { paymentProvider } from "@/server/stars/payments";

/** Оплатить месяц тарифа: создаём платёж и отправляем на страницу оплаты провайдера. */
export async function buyPlan(tier: string, next: string): Promise<void> {
  const user = await requireOrganizationUser(routes.pricing);
  const plan = plans.find((p) => p.tier === tier && p.price > 0);
  if (!plan) redirect(routes.pricing);
  const url = await startPlanPurchase(
    user.organization.id,
    user.id,
    plan.tier,
    safeNext(next, routes.plan),
  );
  redirect(url);
}

/** Тестовая оплата. Работает только с заглушкой: настоящий провайдер подтверждает платёж сам. */
export async function payPlanWithStub(purchaseId: string, next: string): Promise<void> {
  const user = await requireOrganizationUser(routes.plan);
  const purchase = await getOwnPlanPurchase(user.organization.id, purchaseId);
  if (!purchase || !paymentProvider().allowsManualConfirmation || purchase.provider !== "stub") {
    redirect(routes.plan);
  }
  await confirmPlanPurchase(purchase.id);
  const returnTo = safeNext(next, routes.plan);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}paid=${purchase.plan}`);
}

export async function cancelPlanPayment(purchaseId: string, next: string): Promise<void> {
  const user = await requireOrganizationUser(routes.plan);
  await cancelPlanPurchase(user.organization.id, purchaseId);
  redirect(safeNext(next, routes.plan));
}
