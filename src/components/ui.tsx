import type { ReactNode } from "react";
import { StarIcon } from "./icons";

/** Общие блоки кабинета и публичной страницы предприятия. */

export function RoleBadges({ isSeller, isBuyer }: { isSeller: boolean; isBuyer: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {isSeller && <Badge tone="brand">Продавец</Badge>}
      {isBuyer && <Badge tone="solid">Покупатель</Badge>}
    </div>
  );
}

// Только фирменные цвета; красный оставлен для ошибок и отказов.
const tones = {
  /** Светло-синяя плашка: роль, обычный статус. */
  brand: "bg-brand/10 text-brand-dark",
  /** Тёмно-синяя: готово, опубликовано, завершено. */
  solid: "bg-brand-dark text-white",
  /** Синяя рамка: ждёт действия. */
  outline: "bg-white text-brand ring-2 ring-inset ring-brand/40",
  gray: "bg-brand-gray/60 text-gray-700",
  red: "bg-red-100 text-red-700",
} as const;

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold ${tones[tone]}`}>{children}</span>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-[-0.01em] text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-5 shadow-[var(--shadow-soft)] md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="from-brand/[0.07] ring-brand/10 flex flex-col gap-1 rounded-3xl bg-linear-to-br to-white p-5 ring-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-brand-dark text-4xl font-extrabold">{value}</span>
      {hint && <span className="text-sm text-gray-500">{hint}</span>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-3xl border-2 border-dashed border-gray-200 px-5 py-8 text-center text-gray-500">
      {children}
    </p>
  );
}

/** Звёзды рейтинга: закрашенные синие и пустые серые. */
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span
      role="img"
      aria-label={`Оценка ${rating} из 5`}
      className="inline-flex items-center gap-0.5 align-[-0.1em]"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={`size-[1em] ${n <= full ? "text-brand" : "text-brand-gray"}`}
        />
      ))}
    </span>
  );
}

/** Число со звездой: «15 ★» в тексте и плитках. */
export function StarAmount({ value, className = "" }: { value: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.2em] whitespace-nowrap ${className}`}>
      {value}
      <StarIcon className="text-brand size-[0.85em]" />
      <span className="sr-only">звёзд</span>
    </span>
  );
}

export function PageFallback() {
  return <div className="bg-brand-gray/40 h-64 animate-pulse rounded-3xl" />;
}

/** Звёзды продвижения заказа: «★ 12». Без звёзд не показывается. */
export function StarCount({ stars, className = "" }: { stars: number; className?: string }) {
  if (stars <= 0) return null;
  return (
    <span
      title={`Вложено звёзд: ${stars}`}
      className={`bg-brand-dark inline-flex shrink-0 items-center gap-[0.3em] rounded-full px-[0.6em] py-[0.25em] font-extrabold tracking-normal whitespace-nowrap text-white shadow-[0_4px_12px_rgb(25_88_126/0.3)] ${className}`}
    >
      <StarIcon className="size-[0.9em]" />
      <span className="sr-only">Звёзд:</span> {stars}
    </span>
  );
}
