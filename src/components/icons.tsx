// Иконки строки поиска, главной и карточек результатов.
import type { ReactNode } from "react";

type IconProps = { className?: string };

export function PlusCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 90 90" fill="none" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M44.7917 0C20.0542 0 0 20.0542 0 44.7917C0 69.5292 20.0542 89.5833 44.7917 89.5833C69.5292 89.5833 89.5833 69.5292 89.5833 44.7917C89.5833 20.0542 69.5292 0 44.7917 0ZM47.9167 28.125C47.9167 27.2962 47.5874 26.5013 47.0014 25.9153C46.4153 25.3292 45.6205 25 44.7917 25C43.9629 25 43.168 25.3292 42.582 25.9153C41.9959 26.5013 41.6667 27.2962 41.6667 28.125V41.6667H28.125C27.2962 41.6667 26.5013 41.9959 25.9153 42.582C25.3292 43.168 25 43.9629 25 44.7917C25 45.6205 25.3292 46.4153 25.9153 47.0014C26.5013 47.5874 27.2962 47.9167 28.125 47.9167H41.6667V61.4583C41.6667 62.2871 41.9959 63.082 42.582 63.668C43.168 64.2541 43.9629 64.5833 44.7917 64.5833C45.6205 64.5833 46.4153 64.2541 47.0014 63.668C47.5874 63.082 47.9167 62.2871 47.9167 61.4583V47.9167H61.4583C62.2871 47.9167 63.082 47.5874 63.668 47.0014C64.2541 46.4153 64.5833 45.6205 64.5833 44.7917C64.5833 43.9629 64.2541 43.168 63.668 42.582C63.082 41.9959 62.2871 41.6667 61.4583 41.6667H47.9167V28.125Z"
        fill="#2074A8"
      />
    </svg>
  );
}

/** Линейные иконки строки поиска и главной: скруглённые концы, толщина 2 из 24, цвет — currentColor. */
function LineIcon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="9" y="2.5" width="6" height="12" rx="3" fill="currentColor" fillOpacity="0.15" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21.5M8.5 21.5h7" />
    </LineIcon>
  );
}

/** Камера с лупой в объективе: поиск по фото детали. */
export function CameraIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path
        d="M3 8.5A2 2 0 0 1 5 6.5h2.2l1.5-2.2h6.6l1.5 2.2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="11.5" cy="12.8" r="3.3" />
      <path d="m13.9 15.2 2.3 2.3" />
    </LineIcon>
  );
}

/** Звезда продвижения заказа и оценки: скруглённые лучи, как у знака логотипа. */
export function StarIcon({ className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M11.1 2.9a1 1 0 0 1 1.8 0l2.3 4.8 5.2.7a1 1 0 0 1 .6 1.7l-3.8 3.7.9 5.2a1 1 0 0 1-1.5 1l-4.6-2.4-4.6 2.4a1 1 0 0 1-1.5-1l.9-5.2-3.8-3.7a1 1 0 0 1 .6-1.7l5.2-.7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </LineIcon>
  );
}

// Иконки разделов каталога на главной.

export function BearingIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle
          key={a}
          cx={12 + 6.25 * Math.cos((a * Math.PI) / 180)}
          cy={12 + 6.25 * Math.sin((a * Math.PI) / 180)}
          r="1.1"
          fill="currentColor"
          stroke="none"
        />
      ))}
    </LineIcon>
  );
}

export function SealIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <ellipse cx="12" cy="9" rx="9" ry="4.5" />
      <path d="M3 9v5c0 2.5 4 4.5 9 4.5s9-2 9-4.5V9" />
      <ellipse cx="12" cy="9" rx="4" ry="2" />
    </LineIcon>
  );
}

export function BeltIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="6.5" cy="12" r="3.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M6.5 8.5 18 9.5M6.5 15.5 18 14.5" />
      <circle cx="6.5" cy="12" r="0.8" fill="currentColor" />
    </LineIcon>
  );
}

export function HydraulicsIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="2.5" y="8.5" width="12" height="7" rx="1.5" />
      <path d="M14.5 12h7M8.5 8.5V6M5 6h7" />
      <path d="M18.5 16.5c0 1-.8 1.8-1.7 1.8s-1.8-.8-1.8-1.8c0-1.2 1.8-3 1.8-3s1.7 1.8 1.7 3Z" />
    </LineIcon>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
      <circle cx="12" cy="12" r="6.5" />
    </LineIcon>
  );
}

export function WheatIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M12 21.5V8" />
      <path d="M12 8c-2-.5-3.2-2-3.2-4.2C10.8 4.2 12 5.8 12 8Zm0 0c2-.5 3.2-2 3.2-4.2C13.2 4.2 12 5.8 12 8Z" />
      <path d="M12 13c-2.3-.4-3.8-2-3.8-4.4 2.3.3 3.8 2 3.8 4.4Zm0 0c2.3-.4 3.8-2 3.8-4.4-2.3.3-3.8 2-3.8 4.4Z" />
      <path d="M12 18c-2.3-.4-3.8-2-3.8-4.4 2.3.3 3.8 2 3.8 4.4Zm0 0c2.3-.4 3.8-2 3.8-4.4-2.3.3-3.8 2-3.8 4.4Z" />
    </LineIcon>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 30 31" fill="none" aria-hidden className={className}>
      <path
        d="M14.7279 30.5H16.7279V2H14.7279H12.7279L12.7279 30.5H14.7279ZM16.1421 0.585787C15.3611 -0.195263 14.0947 -0.195263 13.3137 0.585787L0.58577 13.3137C-0.195279 14.0948 -0.195279 15.3611 0.58577 16.1421C1.36682 16.9232 2.63315 16.9232 3.4142 16.1421L14.7279 4.82843L26.0416 16.1421C26.8227 16.9232 28.089 16.9232 28.87 16.1421C29.6511 15.3611 29.6511 14.0948 28.87 13.3137L16.1421 0.585787Z"
        fill="white"
      />
    </svg>
  );
}

/** «Arrow left-circle» из карточки результата поиска. */
export function ArrowLeftCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 8 8 12 12 16" />
      <line x1="16" y1="12" x2="8" y2="12" />
    </svg>
  );
}

/** Снимок: рамка с горами и солнцем — место под фото позиции или заказа. */
export function PhotoIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="3" fill="currentColor" fillOpacity="0.12" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m3.5 17 5-5 3.5 3.5 2.5-2.5 6 5.5" />
    </LineIcon>
  );
}

/** Искра: всё, что подготовил ИИ (сводка о производителе, распознавание по фото). */
export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M11.2 2.6a.85.85 0 0 1 1.6 0l1.5 4.3a3 3 0 0 0 1.8 1.8l4.3 1.5a.85.85 0 0 1 0 1.6l-4.3 1.5a3 3 0 0 0-1.8 1.8l-1.5 4.3a.85.85 0 0 1-1.6 0l-1.5-4.3a3 3 0 0 0-1.8-1.8l-4.3-1.5a.85.85 0 0 1 0-1.6l4.3-1.5a3 3 0 0 0 1.8-1.8z" />
      <path d="M19 1.5a.5.5 0 0 1 .95 0l.45 1.3a1 1 0 0 0 .6.6l1.3.45a.5.5 0 0 1 0 .95l-1.3.45a1 1 0 0 0-.6.6l-.45 1.3a.5.5 0 0 1-.95 0l-.45-1.3a1 1 0 0 0-.6-.6l-1.3-.45a.5.5 0 0 1 0-.95l1.3-.45a1 1 0 0 0 .6-.6z" />
    </svg>
  );
}

/**
 * Значок раскрытия раздела (`<details>`): шеврон в круге, смотрит вниз у свёрнутого раздела
 * и поворачивается вверх у раскрытого. Родитель `<details>` должен иметь класс `group`.
 */
export function DisclosureIcon({ className = "" }: IconProps) {
  return (
    <span
      aria-hidden
      className={`bg-brand-mist text-brand-dark grid size-10 shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-300 group-open:rotate-180 group-hover:bg-[#dfe6f6] max-md:size-8 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5 max-md:size-4">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
