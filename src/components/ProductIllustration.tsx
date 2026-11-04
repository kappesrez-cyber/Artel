import type { ReactNode } from "react";

/**
 * Простая картинка детали, пока производитель не загрузил фото: вид детали подбирается
 * по словам из названия и описания («подшипник», «манжета», «фильтр»…).
 * Рисунок в фирменных цветах, без надписи «Фото пока нет».
 */

export type PartKind =
  | "bearing"
  | "seal"
  | "belt"
  | "chain"
  | "cylinder"
  | "filter"
  | "pulley"
  | "shaft"
  | "blade"
  | "gear"
  | "ingredient"
  | "plow"
  | "part";

const rules: [PartKind, RegExp][] = [
  ["plow", /плуг|лемех/],
  ["bearing", /подшипник|bearing/],
  ["seal", /манжет|уплотн|сальник|кольц/],
  ["belt", /ремен|ремн/],
  ["chain", /цеп[ьи]/],
  ["filter", /фильтр/],
  ["cylinder", /цилиндр|гидро|насос|клапан/],
  ["pulley", /шкив|вариатор|ролик/],
  ["gear", /шестерн|звёздочк|звездочк|редуктор/],
  ["blade", /нож|сегмент|лезви/],
  ["shaft", /(^|[^а-яё])(вал|ось)[аыуе]?([^а-яё]|$)/],
  ["ingredient", /амилаз|фермент|заквас|ингредиент|порош|культур|дрожж/],
];

/** Вид детали по названию (и описанию, если по названию не понятно). */
export function partKind(name: string, description?: string | null): PartKind {
  for (const text of [name, description ?? ""]) {
    const lower = `${text.toLowerCase()} `;
    for (const [kind, pattern] of rules) if (pattern.test(lower)) return kind;
  }
  return "part";
}

/** Название вида для подписи и характеристик. */
export const partKindLabels: Record<PartKind, string> = {
  bearing: "Подшипники",
  seal: "Уплотнения",
  belt: "Ремни",
  chain: "Цепи",
  cylinder: "Гидравлика",
  filter: "Фильтры",
  pulley: "Шкивы и ролики",
  shaft: "Валы и оси",
  blade: "Режущие элементы",
  gear: "Шестерни и звёздочки",
  ingredient: "Ингредиенты",
  plow: "Плуги и почвообработка",
  part: "Детали и узлы",
};

const INK = "#173780";
const FILL = "#c9d6f0";
const PAPER = "#ffffff";

const stroke = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function gearPath(cx: number, cy: number, teeth: number, outer: number, inner: number) {
  const points: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const corners = [
      [inner, a - step * 0.3],
      [outer, a - step * 0.16],
      [outer, a + step * 0.16],
      [inner, a + step * 0.3],
    ] as const;
    for (const [r, t] of corners) {
      points.push(`${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`);
    }
  }
  return `M${points.join("L")}Z`;
}

const drawings: Record<PartKind, ReactNode> = {
  plow: (
    <>
      <path d="M18 30 L142 30" {...stroke} strokeWidth={7} />
      {[40, 80, 120].map((x) => (
        <g key={x}>
          <path d={`M${x} 30 L${x - 6} 62`} {...stroke} strokeWidth={4} />
          <path
            d={`M${x - 18} 70 C ${x - 6} 66 ${x + 6} 56 ${x + 12} 42 L ${x + 16} 48 C ${x + 10} 64 ${x - 2} 76 ${x - 18} 78 Z`}
            fill={FILL}
            {...stroke}
          />
          <path
            d={`M${x - 20} 78 L${x - 2} 77 L${x + 6} 84 L${x - 20} 85 Z`}
            fill={PAPER}
            {...stroke}
          />
        </g>
      ))}
    </>
  ),
  bearing: (
    <>
      <circle cx="80" cy="50" r="38" fill={FILL} {...stroke} />
      <circle cx="80" cy="50" r="30" fill={PAPER} {...stroke} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={(80 + 23 * Math.cos(a)).toFixed(1)}
            cy={(50 + 23 * Math.sin(a)).toFixed(1)}
            r="5.5"
            fill={INK}
          />
        );
      })}
      <circle cx="80" cy="50" r="16" fill={FILL} {...stroke} />
      <circle cx="80" cy="50" r="9" fill={PAPER} {...stroke} />
    </>
  ),
  seal: (
    <>
      <circle cx="80" cy="50" r="38" fill={FILL} {...stroke} />
      <circle cx="80" cy="50" r="31" fill="none" {...stroke} strokeDasharray="2 6" />
      <circle cx="80" cy="50" r="24" fill={PAPER} {...stroke} />
      <circle cx="80" cy="50" r="19" fill="none" {...stroke} strokeWidth={2} opacity={0.5} />
    </>
  ),
  belt: (
    <>
      <path
        d="M52 22 L120 33 A17 17 0 0 1 120 67 L52 78 A28 28 0 0 1 52 22 Z"
        fill="none"
        {...stroke}
        strokeWidth={7}
      />
      <circle cx="52" cy="50" r="22" fill={FILL} {...stroke} />
      <circle cx="52" cy="50" r="6" fill={PAPER} {...stroke} />
      <circle cx="120" cy="50" r="12" fill={FILL} {...stroke} />
      <circle cx="120" cy="50" r="4" fill={PAPER} {...stroke} />
    </>
  ),
  chain: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={14 + i * 26}
          y={i % 2 ? 38 : 34}
          width="36"
          height={i % 2 ? 24 : 32}
          rx={i % 2 ? 12 : 16}
          fill={i % 2 ? PAPER : FILL}
          {...stroke}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={32 + i * 26 - 13} cy="50" r="4" fill={INK} />
      ))}
    </>
  ),
  cylinder: (
    <>
      <circle cx="20" cy="50" r="9" fill={PAPER} {...stroke} />
      <rect x="28" y="34" width="72" height="32" rx="5" fill={FILL} {...stroke} />
      <rect x="40" y="26" width="10" height="8" fill={PAPER} {...stroke} />
      <rect x="80" y="26" width="10" height="8" fill={PAPER} {...stroke} />
      <rect x="100" y="45" width="34" height="10" fill={PAPER} {...stroke} />
      <circle cx="142" cy="50" r="9" fill={PAPER} {...stroke} />
      <path d="M100 38v24" {...stroke} />
    </>
  ),
  filter: (
    <>
      <rect x="54" y="18" width="52" height="66" rx="6" fill={FILL} {...stroke} />
      {[64, 72, 80, 88, 96].map((x) => (
        <path key={x} d={`M${x} 28v46`} {...stroke} strokeWidth={2} />
      ))}
      <rect x="50" y="14" width="60" height="10" rx="4" fill={PAPER} {...stroke} />
      <rect x="50" y="78" width="60" height="10" rx="4" fill={PAPER} {...stroke} />
    </>
  ),
  pulley: (
    <>
      <circle cx="80" cy="50" r="38" fill={FILL} {...stroke} />
      <circle cx="80" cy="50" r="31" fill="none" {...stroke} strokeWidth={2} />
      {[0, 72, 144, 216, 288].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <path
            key={deg}
            d={`M${(80 + 12 * Math.cos(a)).toFixed(1)} ${(50 + 12 * Math.sin(a)).toFixed(1)}L${(80 + 27 * Math.cos(a)).toFixed(1)} ${(50 + 27 * Math.sin(a)).toFixed(1)}`}
            {...stroke}
            strokeWidth={5}
          />
        );
      })}
      <circle cx="80" cy="50" r="12" fill={PAPER} {...stroke} />
      <circle cx="80" cy="50" r="5" fill={INK} />
    </>
  ),
  shaft: (
    <>
      <rect x="14" y="43" width="26" height="14" rx="2" fill={PAPER} {...stroke} />
      <rect x="40" y="36" width="64" height="28" rx="3" fill={FILL} {...stroke} />
      <rect x="58" y="44" width="28" height="6" rx="3" fill={PAPER} {...stroke} strokeWidth={2} />
      <rect x="104" y="40" width="22" height="20" rx="2" fill={PAPER} {...stroke} />
      <rect x="126" y="44" width="20" height="12" rx="2" fill={FILL} {...stroke} />
    </>
  ),
  blade: (
    <>
      <path d="M80 14 L122 82 L38 82 Z" fill={FILL} {...stroke} />
      <path
        d="M80 14 L38 82"
        {...stroke}
        strokeDasharray="3 4"
        opacity={0.6}
        transform="translate(5 0)"
      />
      <path
        d="M80 14 L122 82"
        {...stroke}
        strokeDasharray="3 4"
        opacity={0.6}
        transform="translate(-5 0)"
      />
      <circle cx="68" cy="68" r="5" fill={PAPER} {...stroke} />
      <circle cx="92" cy="68" r="5" fill={PAPER} {...stroke} />
    </>
  ),
  gear: (
    <>
      <path d={gearPath(80, 50, 14, 40, 32)} fill={FILL} {...stroke} />
      <circle cx="80" cy="50" r="20" fill={PAPER} {...stroke} />
      <circle cx="80" cy="50" r="8" fill={FILL} {...stroke} />
    </>
  ),
  ingredient: (
    <>
      <path
        d="M54 30 Q54 20 64 20 H96 Q106 20 106 30 L112 80 Q112 86 106 86 H54 Q48 86 48 80 Z"
        fill={FILL}
        {...stroke}
      />
      <path d="M58 30 H102" {...stroke} strokeWidth={2} />
      <path d="M80 76 V44" {...stroke} />
      {[48, 56, 64].map((y) => (
        <g key={y}>
          <path
            d={`M80 ${y + 6} q-9 -2 -10 -10 q9 1 10 10Z`}
            fill={PAPER}
            {...stroke}
            strokeWidth={2}
          />
          <path
            d={`M80 ${y + 6} q9 -2 10 -10 q-9 1 -10 10Z`}
            fill={PAPER}
            {...stroke}
            strokeWidth={2}
          />
        </g>
      ))}
    </>
  ),
  part: (
    <>
      <path d="M80 12 L113 31 L113 69 L80 88 L47 69 L47 31 Z" fill={FILL} {...stroke} />
      <circle cx="80" cy="50" r="16" fill={PAPER} {...stroke} />
      <circle
        cx="80"
        cy="50"
        r="10"
        fill="none"
        {...stroke}
        strokeWidth={2}
        strokeDasharray="3 3"
      />
    </>
  ),
};

export function ProductIllustration({
  name,
  description,
  className = "",
}: {
  name: string;
  description?: string | null;
  className?: string;
}) {
  const kind = partKind(name, description);
  return (
    <div
      role="img"
      aria-label={`Иллюстрация: ${partKindLabels[kind].toLowerCase()}`}
      className={`grid place-items-center bg-[linear-gradient(160deg,#f4f7fd,#e4ebf8)] ${className}`}
    >
      <svg viewBox="0 0 160 100" className="h-[72%] w-auto max-w-[80%]" aria-hidden>
        {drawings[kind]}
      </svg>
    </div>
  );
}
