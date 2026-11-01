"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modeForPath, modes, type Mode } from "./navigation";

/** Ползунок «Покупателям | Продавцам» в шапке. */
export function ModeSwitch() {
  return <ModeSwitchView active={modeForPath(usePathname())} />;
}

/** Сам ползунок; `active` неизвестен, пока адрес не известен при пререндере. */
export function ModeSwitchView({ active }: { active: Mode | null }) {
  const index = modes.findIndex((m) => m.mode === active);
  return (
    <div
      role="group"
      aria-label="Режим"
      className="relative grid grid-cols-2 rounded-full bg-white/15 p-1 text-sm tracking-normal text-white"
    >
      {index >= 0 && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
      )}
      {modes.map(({ mode, href, label }) => (
        <Link
          key={mode}
          href={href}
          aria-current={mode === active ? "page" : undefined}
          className="aria-[current=page]:text-brand-dark relative z-10 rounded-full px-4 py-2 text-center whitespace-nowrap text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white max-lg:px-3 max-lg:py-1.5"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
