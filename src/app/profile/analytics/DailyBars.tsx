"use client";

import { useState } from "react";

type Point = { day: string; value: number };

const W = 720;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 24, left: 32 };

const dayLabel = (day: string) => {
  const [, m, d] = day.split("-");
  return `${d}.${m}`;
};

/** Сколько делений на оси: «красивый» шаг, чтобы подписи были круглыми. */
function niceMax(max: number): { top: number; step: number } {
  if (max <= 4) return { top: Math.max(max, 1), step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * pow).find((s) => s >= raw) ?? raw;
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * Столбики по дням: один ряд, цвет бренда, подсказка с датой и числом при наведении
 * (и с клавиатуры — столбики фокусируются). Под графиком — таблица для экранных чтецов.
 */
export function DailyBars({ points, label }: { points: Point[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...points.map((p) => p.value));
  const { top, step } = niceMax(max);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const gap = Math.min(2, slot * 0.2);
  const barW = slot - gap;
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);
  // Подписи дат: не больше ~8, чтобы не наезжали.
  const every = Math.ceil(points.length / 8);
  const current = active === null ? null : points[active];

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${label} по дням`}
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? "stroke-gray-300" : "stroke-gray-100"}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-gray-400 text-[11px]"
            >
              {t}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = PAD.left + i * slot + gap / 2;
          const h = Math.max(0, y(0) - y(p.value));
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={p.day}>
              {/* Зона наведения — во всю высоту и ширину дня, больше самого столбика. */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${dayLabel(p.day)}: ${p.value}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none"
              />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`}
                  className={`pointer-events-none transition-opacity ${active === null || active === i ? "fill-brand" : "fill-brand opacity-40"}`}
                />
              )}
              {i % every === 0 && (
                <text
                  x={PAD.left + i * slot + slot / 2}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-gray-400 text-[11px]"
                >
                  {dayLabel(p.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {current && active !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-1.5 text-sm whitespace-nowrap text-white shadow-lg"
          style={{ left: `${((PAD.left + active * slot + slot / 2) / W) * 100}%` }}
        >
          <span className="text-gray-300">{dayLabel(current.day)}</span> <b>{current.value}</b>
        </div>
      )}
      <table className="sr-only">
        <caption>{label} по дням</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <th>{dayLabel(p.day)}</th>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
