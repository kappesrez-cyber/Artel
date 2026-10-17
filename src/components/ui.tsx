import type { ReactNode } from "react";

/** Общие блоки кабинета и публичной страницы предприятия. */

export function RoleBadges({ isSeller, isBuyer }: { isSeller: boolean; isBuyer: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {isSeller && <Badge tone="brand">Продавец</Badge>}
      {isBuyer && <Badge tone="green">Покупатель</Badge>}
    </div>
  );
}

const tones = {
  brand: "bg-brand/10 text-brand-dark",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-700",
  amber: "bg-amber-100 text-amber-800",
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
    <div className={`rounded-3xl border-2 border-gray-200 bg-white p-5 md:p-6 ${className}`}>
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
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-gray-50 p-5">
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

/** Звёзды рейтинга: «★★★★☆». */
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-label={`Оценка ${rating} из 5`} className="tracking-widest text-amber-500">
      {"★".repeat(full)}
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function PageFallback() {
  return <div className="h-64 animate-pulse rounded-3xl bg-gray-100" />;
}
