"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Кнопка-«бургер» и выпадающая панель меню для телефона. Панель закрывается при переходе
 * на другую страницу, по Escape и по нажатию мимо неё.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen(!open);
        }}
        className="relative z-30 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white/12 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
          <path
            d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default bg-black/25 lg:hidden"
          />
          <div
            id="mobile-menu"
            className="bg-brand-dark absolute inset-x-3 top-full z-30 mt-2 flex flex-col gap-1 rounded-3xl p-3 text-lg font-bold tracking-normal text-white shadow-[var(--shadow-lift)] lg:hidden"
          >
            {children}
          </div>
        </>
      )}
    </>
  );
}
