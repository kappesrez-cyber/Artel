import type { ReactNode } from "react";

/** Рамка страниц входа и регистрации. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 justify-center px-4 py-10 md:py-16">
      <div className="flex w-full max-w-xl flex-col gap-6 rounded-[2rem] border-4 border-gray-200 bg-white p-6 md:p-10">
        <h1 className="font-display text-brand-dark text-3xl leading-tight md:text-4xl">{title}</h1>
        {children}
      </div>
    </main>
  );
}
