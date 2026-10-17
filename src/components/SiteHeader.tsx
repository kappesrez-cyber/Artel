import Link from "next/link";
import { Logo } from "./Logo";
import { mainNav, routes, secondaryNav } from "./navigation";

const navLink =
  "rounded-[calc(var(--u)*16)] px-[calc(var(--u)*8)] whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white";

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center gap-[calc(var(--u)*19)] px-[calc(var(--u)*19)] pt-[calc(var(--u)*16)] max-md:gap-y-3">
      <Link href={routes.home} aria-label="Artel — на главную" className="shrink-0">
        <Logo className="h-[calc(var(--u)*64)] w-auto" />
      </Link>

      <nav
        aria-label="Основное меню"
        className="bg-brand flex h-[calc(var(--u)*128)] min-w-0 items-center justify-between gap-[calc(var(--u)*48)] overflow-x-auto rounded-[calc(var(--u)*31)] px-[calc(var(--u)*41)] leading-none font-bold tracking-[-0.04em] text-white max-md:order-last max-md:w-full md:w-[calc(var(--u)*1368)] md:text-[calc(var(--u)*48)]"
      >
        <ul className="flex items-center gap-[calc(var(--u)*48)] max-md:gap-1">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex items-center gap-[calc(var(--u)*48)] max-md:gap-1">
          {secondaryNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link
        href={routes.profile}
        aria-label="Личный кабинет"
        className="bg-brand-gray focus-visible:outline-brand ml-auto size-[calc(var(--u)*111)] shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 md:mr-[calc(var(--u)*9)]"
      />
    </header>
  );
}
