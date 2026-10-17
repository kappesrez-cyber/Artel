"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const cabinetSections = [
  { href: "/profile", label: "Обзор" },
  { href: "/profile/company", label: "О предприятии" },
  { href: "/profile/documents", label: "Документы и отчёты" },
  { href: "/profile/products", label: "Мой каталог" },
  { href: "/profile/deals", label: "Сделки" },
  { href: "/profile/orders", label: "Мои заказы" },
  { href: "/profile/stars", label: "Звёзды" },
  { href: "/profile/reviews", label: "Отзывы" },
  { href: "/profile/analytics", label: "Аналитика" },
] as const;

/** Разделы кабинета: столбец слева на компьютере, прокручиваемая строка на телефоне. */
export function CabinetNav() {
  return <CabinetNavList pathname={usePathname()} />;
}

/** Сами ссылки; без `pathname` (пока адрес не известен при пререндере) ни одна не выделена. */
export function CabinetNavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Разделы кабинета" className="max-md:-mx-4 max-md:overflow-x-auto max-md:px-4">
      <ul className="flex gap-1 md:flex-col">
        {cabinetSections.map(({ href, label }) => {
          const active =
            href === "/profile"
              ? pathname === href
              : pathname === href || Boolean(pathname?.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="aria-[current=page]:bg-brand block rounded-2xl px-4 py-2.5 font-bold whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-100 aria-[current=page]:text-white"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
