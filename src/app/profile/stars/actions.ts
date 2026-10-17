"use server";

import { redirect } from "next/navigation";
import { routes } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { safeNext } from "@/server/forms";
import { paymentProvider } from "@/server/stars/payments";
import {
  cancelStarPurchase,
  confirmStarPurchase,
  getOwnStarPurchase,
  startStarPurchase,
} from "@/server/stars/stars";

/** Купить пакет: создаём платёж и отправляем на страницу оплаты провайдера. */
export async function buyStars(stars: number, next: string): Promise<void> {
  const user = await requireOrganizationUser(routes.stars);
  const returnTo = safeNext(next, routes.stars);
  const url = await startStarPurchase(user.organization.id, user.id, stars, returnTo);
  redirect(url);
}

/** Тестовая оплата. Работает только с заглушкой: настоящий провайдер подтверждает платёж сам. */
export async function payWithStub(purchaseId: string, next: string): Promise<void> {
  const user = await requireOrganizationUser(routes.stars);
  const purchase = await getOwnStarPurchase(user.organization.id, purchaseId);
  if (!purchase || !paymentProvider().allowsManualConfirmation || purchase.provider !== "stub") {
    redirect(routes.stars);
  }
  await confirmStarPurchase(purchase.id);
  const returnTo = safeNext(next, routes.stars);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}stars=${purchase.stars}`);
}

export async function cancelPurchase(purchaseId: string, next: string): Promise<void> {
  const user = await requireOrganizationUser(routes.stars);
  await cancelStarPurchase(user.organization.id, purchaseId);
  redirect(safeNext(next, routes.stars));
}
