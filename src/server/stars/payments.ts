import "server-only";
import { env } from "@/server/env";

/**
 * Платёжный провайдер для покупки звёзд и оплаты тарифов.
 *
 * Сейчас подключена только заглушка `stub`: она «проводит» оплату на тестовой странице
 * `/stars/checkout/{id}` без настоящих денег. Чтобы подключить настоящий приём платежей
 * (ЮKassa, CloudPayments, Тинькофф):
 * 1. Реализовать `PaymentProvider` (создать платёж в API провайдера, вернуть его номер и ссылку
 *    на страницу оплаты) и добавить его в `providers` и в `PAYMENT_PROVIDER` (`src/server/env.ts`).
 * 2. Добавить маршрут для уведомлений провайдера (например, `/api/payments/webhook`): проверить
 *    подпись и вызвать `confirmStarPurchase(purchaseId)` из `./stars.ts` — он зачисляет звёзды
 *    один раз, даже если уведомление придёт повторно.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Создать платёж. `returnUrl` — куда провайдер вернёт покупателя после оплаты. */
  createPayment(payment: {
    /** Что оплачивается: пакет звёзд (`StarPurchase`) или месяц тарифа (`PlanPurchase`). */
    kind: "stars" | "plan";
    purchaseId: string;
    /** Сумма в рублях, строкой с копейками: «450.00». */
    amount: string;
    description: string;
    returnUrl: string;
  }): Promise<{ paymentId: string; confirmationUrl: string }>;
  /** Можно ли подтвердить оплату с тестовой страницы сайта (только у заглушки). */
  readonly allowsManualConfirmation: boolean;
}

const stub: PaymentProvider = {
  name: "stub",
  allowsManualConfirmation: true,
  async createPayment({ kind, purchaseId, returnUrl }) {
    const url = `/${kind === "plan" ? "plans" : "stars"}/checkout/${encodeURIComponent(purchaseId)}?next=${encodeURIComponent(returnUrl)}`;
    return { paymentId: `stub_${purchaseId}`, confirmationUrl: url };
  },
};

const providers = { stub } satisfies Record<
  ReturnType<typeof env>["PAYMENT_PROVIDER"],
  PaymentProvider
>;

export function paymentProvider(): PaymentProvider {
  return providers[env().PAYMENT_PROVIDER];
}
