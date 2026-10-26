import type { ReactNode } from "react";
import type { AssessmentPoint, PointKind, Tone } from "@/server/assessment/assess";
import { CheckIcon, SparkleIcon } from "./icons";

/**
 * ИИ-сводка о предприятии (`src/server/assessment`): итог в пару слов, индекс доверия
 * и пункты проверки. Цвет итога — по оценке: синие хорошие, жёлтый «есть вопросы», красный риск.
 */

const verdictTones: Record<Tone, string> = {
  RELIABLE: "bg-brand-dark text-white",
  GOOD: "bg-brand text-white",
  CAUTION: "bg-amber-400 text-gray-900",
  RISK: "bg-red-600 text-white",
};

const ringTones: Record<Tone, string> = {
  RELIABLE: "text-brand-dark",
  GOOD: "text-brand",
  CAUTION: "text-amber-500",
  RISK: "text-red-600",
};

/** Итог сводки плашкой: «Надёжный производитель», «Перекуп-пустышка». */
export function VerdictBadge({
  verdict,
  tone,
  className = "px-3 py-1 text-sm",
}: {
  verdict: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      title="Итог ИИ-сводки"
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-extrabold ${verdictTones[tone]} ${className}`}
    >
      <SparkleIcon className="size-[1.05em] shrink-0" />
      {verdict}
    </span>
  );
}

/** Индекс доверия кольцом: 0–100. */
export function ScoreRing({
  score,
  tone,
  size = 112,
}: {
  score: number;
  tone: Tone;
  size?: number;
}) {
  const r = 42;
  const length = 2 * Math.PI * r;
  return (
    <div
      role="img"
      aria-label={`Индекс доверия ${score} из 100`}
      className={`relative grid shrink-0 place-items-center ${ringTones[tone]}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(length * score) / 100} ${length}`}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span className="font-extrabold" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
        {size >= 80 && <span className="mt-1 text-xs font-bold text-gray-500">из 100</span>}
      </span>
    </div>
  );
}

const pointStyles: Record<PointKind, { mark: ReactNode; className: string }> = {
  ok: { mark: <CheckIcon className="size-3.5" />, className: "bg-brand/12 text-brand-dark" },
  warn: { mark: "!", className: "bg-amber-100 text-amber-700" },
  bad: { mark: "✕", className: "bg-red-100 text-red-700" },
};

const kindOrder: PointKind[] = ["bad", "warn", "ok"];
const rank = (p: AssessmentPoint) =>
  kindOrder.indexOf(p.kind) * 4 +
  (p.source === "external" ? 0 : /сделк|отчётност/.test(p.text) ? 1 : 2);

/** Пункты по важности: сначала тревожные, потом внешние проверки, сделки и отчётность. */
export function byImportance(points: AssessmentPoint[]) {
  return [...points].sort((a, b) => rank(a) - rank(b));
}

export function AssessmentPanel({
  assessment,
  name,
}: {
  assessment: {
    verdict: string;
    tone: Tone;
    score: number;
    summary: string;
    points: AssessmentPoint[];
    generatedAt: Date;
  };
  name: string;
}) {
  const external = assessment.points.some((p) => p.source === "external");
  const points = byImportance(assessment.points);
  return (
    <section
      aria-label="ИИ-сводка о предприятии"
      className="relative overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white shadow-[var(--shadow-soft)]"
    >
      <div className="from-brand-dark to-brand flex items-center gap-4 bg-linear-to-r px-5 py-5 text-white md:gap-6 md:px-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-white/80 uppercase">
            <SparkleIcon className="size-4" /> ИИ-сводка о производителе
          </span>
          <p className="text-2xl leading-tight font-extrabold break-words hyphens-auto max-sm:text-xl md:text-3xl">
            {name}: <span className="sm:whitespace-nowrap">{assessment.verdict.toLowerCase()}</span>
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-white p-1.5">
          <ScoreRing score={assessment.score} tone={assessment.tone} size={96} />
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5 py-6 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <VerdictBadge
            verdict={assessment.verdict}
            tone={assessment.tone}
            className="px-4 py-1.5 text-base"
          />
          <p className="min-w-[min(16rem,100%)] flex-1 text-lg text-gray-700">
            {assessment.summary}
          </p>
        </div>
        <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {points.map((point) => (
            <li key={point.text} className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-sm font-extrabold ${pointStyles[point.kind].className}`}
              >
                {pointStyles[point.kind].mark}
              </span>
              <span className="text-gray-800">
                {point.text}
                {point.source === "external" && (
                  <span className="ml-2 align-middle text-xs font-bold text-gray-400 uppercase">
                    внешняя проверка
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500">
          Собрано ИИ {formatDay(assessment.generatedAt)} по данным платформы
          {external ? ", ЕГРЮЛ, ФНС и картотеки арбитражных дел" : ""}. Это подсказка, а не
          гарантия: решение о сделке остаётся за вами.
        </p>
      </div>
    </section>
  );
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Moscow",
  }).format(date);
}
