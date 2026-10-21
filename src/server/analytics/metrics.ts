/** Чистые расчёты для раздела «Аналитика»: без базы, поэтому покрыты юнит-тестами. */

export const PERIODS = [7, 30, 90] as const;
export type PeriodDays = (typeof PERIODS)[number];

/** Период из адреса (`?period=30`); всё непонятное — 30 дней. */
export function parsePeriod(value: unknown): PeriodDays {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (PERIODS as readonly number[]).includes(n) ? (n as PeriodDays) : 30;
}

/** Изменение к прошлому периоду в процентах; `null`, если сравнивать не с чем. */
export function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Доля в процентах с одним знаком: 3 из 40 → 7.5. */
export function percent(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export type DayPoint = { day: string; value: number };

/**
 * Ряд по дням без пропусков: дни без событий — нули. `rows` — то, что вернула база
 * (`day` в формате YYYY-MM-DD, по московскому времени), `days` — длина периода.
 */
export function fillDays(rows: DayPoint[], days: number, now: Date = new Date()): DayPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.value]));
  const today = moscowDay(now);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1 - i) * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    return { day, value: byDay.get(day) ?? 0 };
  });
}

/** «Сегодня» в Москве как YYYY-MM-DD. */
export function moscowDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(now);
}

/** Распределение оценок 1–5 с нулями для отсутствующих. */
export function ratingHistogram(rows: { rating: number; count: number }[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const { rating, count } of rows) if (rating >= 1 && rating <= 5) counts[rating - 1] = count;
  return counts;
}
