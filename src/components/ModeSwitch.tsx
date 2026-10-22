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
      className="bg-brand-gray relative grid grid-cols-2 rounded-[calc(var(--u)*37)] p-[calc(var(--u)*6)] text-[calc(var(--u)*38)] tracking-[-0.03em] text-black shadow-[inset_0_calc(var(--u)*2)_calc(var(--u)*6)_rgb(0_0_0/0.12)] max-lg:rounded-full max-lg:p-1 max-lg:text-sm"
    >
      {index >= 0 && (
        <span
          aria-hidden
          className="absolute inset-y-[calc(var(--u)*6)] left-[calc(var(--u)*6)] w-[calc(50%-var(--u)*6)] rounded-[calc(var(--u)*31)] bg-white shadow-[0_calc(var(--u)*3)_calc(var(--u)*10)_rgb(0_0_0/0.18)] transition-transform duration-300 ease-out max-lg:inset-y-1 max-lg:left-1 max-lg:w-[calc(50%-0.25rem)] max-lg:rounded-full"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
      )}
      {modes.map(({ mode, href, label }) => (
        <Link
          key={mode}
          href={href}
          aria-current={mode === active ? "page" : undefined}
          className="relative z-10 rounded-[calc(var(--u)*31)] px-[calc(var(--u)*22)] py-[calc(var(--u)*12)] text-center whitespace-nowrap text-black/55 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-white aria-[current=page]:text-black max-lg:px-3 max-lg:py-1.5"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
