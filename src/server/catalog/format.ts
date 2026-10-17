import "server-only";

/** Часовой пояс, в котором считаем «сегодня» для дат готовности. */
export const DISPLAY_TIME_ZONE = "Europe/Moscow";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Дата готовности: день просмотра плюс срок производства в календарных днях.
 * Возвращает полночь UTC нужного дня, чтобы дальше не зависеть от часового пояса сервера.
 */
export function readyDate(leadTimeDays: number, now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const today = Date.UTC(get("year"), get("month") - 1, get("day"));
  return new Date(today + leadTimeDays * MS_PER_DAY);
}

/** 15.12.2026 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** «1 000 000 ₽», копейки — только если они есть. */
export function formatPrice(price: string): string {
  const value = Number(price);
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  // Пробелы-разделители разрядов неразрывные, чтобы цена не переносилась.
  return `${formatted.replace(/\s/g, " ")} ₽`;
}

/** Дата события (создана, завершена) по московскому времени: 17.10.2026. */
export function formatMoment(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
