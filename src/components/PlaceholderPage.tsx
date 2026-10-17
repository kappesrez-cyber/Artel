import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "./navigation";

/** Пустая страница-заглушка: раздел ещё не сделан, но кнопка, которая сюда ведёт, уже работает. */
export function PlaceholderPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="font-display text-brand-dark text-4xl leading-tight md:text-5xl">{title}</h1>
      {children}
      <p className="text-lg text-black/50">Раздел в разработке.</p>
      <Link
        href={routes.home}
        className="bg-brand rounded-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-80"
      >
        На главную
      </Link>
    </main>
  );
}
