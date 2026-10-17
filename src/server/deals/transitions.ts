import "server-only";

export type DealStatus = "REQUESTED" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
export type DealSide = "seller" | "buyer";
export type DealAction = "accept" | "cancel" | "complete";

/**
 * Правила хода сделки:
 * - продавец принимает предложенную сделку;
 * - покупатель подтверждает получение, и сделка становится успешной;
 * - любая сторона может отменить сделку, пока она не завершена.
 *
 * Возвращает новый статус или `null`, если действие сейчас недоступно этой стороне.
 */
export function nextDealStatus(
  status: DealStatus,
  side: DealSide,
  action: DealAction,
): DealStatus | null {
  switch (action) {
    case "accept":
      return side === "seller" && status === "REQUESTED" ? "ACCEPTED" : null;
    case "complete":
      return side === "buyer" && status === "ACCEPTED" ? "COMPLETED" : null;
    case "cancel":
      return status === "REQUESTED" || status === "ACCEPTED" ? "CANCELLED" : null;
  }
}

/** Действия, доступные стороне в текущем статусе, — для кнопок в кабинете. */
export function availableDealActions(status: DealStatus, side: DealSide): DealAction[] {
  return (["accept", "complete", "cancel"] as const).filter(
    (action) => nextDealStatus(status, side, action) !== null,
  );
}
