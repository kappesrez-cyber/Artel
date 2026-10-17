import Link from "next/link";
import { Logo } from "./Logo";
import { mainNav, routes, secondaryNav } from "./navigation";

const navLink =
  "rounded-[calc(var(--u)*16)] px-[calc(var(--u)*8)] whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white";

/** Верхнее меню: одна синяя плашка с белым логотипом, разделами и аватаром (макет «Поиск. Покупатель»). */
export function SiteHeader() {
  return (
    <header className="px-[calc(var(--u)*40)] pt-[calc(var(--u)*35)] max-md:px-3 max-md:pt-3">
      <nav
        aria-label="Основное меню"
        className="bg-brand flex flex-wrap items-center rounded-[calc(var(--u)*31)] pr-[calc(var(--u)*17)] pl-[calc(var(--u)*14)] leading-none font-bold tracking-[-0.04em] text-white shadow-[0_calc(var(--u)*6)_calc(var(--u)*24)_rgb(0_0_0/0.18)] max-md:gap-y-2 max-md:py-2 md:h-[calc(var(--u)*124)] md:text-[calc(var(--u)*48)]"
      >
        <Link
          href={routes.home}
          aria-label="Artel — на главную"
          className="shrink-0 rounded-[calc(var(--u)*16)] focus-visible:outline-2 focus-visible:outline-white"
        >
          <Logo tone="white" className="h-[calc(var(--u)*80)] w-auto max-md:h-10" />
        </Link>

        <ul className="flex items-center gap-[calc(var(--u)*48)] max-md:order-last max-md:w-full max-md:justify-around md:ml-[calc(var(--u)*15)] md:flex-1">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}
          {secondaryNav.map((item, i) => (
            <li key={item.href} className={i === 0 ? "md:ml-auto" : undefined}>
              <Link href={item.href} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={routes.profile}
          aria-label="Личный кабинет"
          className="grid size-[calc(var(--u)*105)] shrink-0 place-items-center rounded-full border-[calc(var(--u)*11)] border-[#dadada] bg-[#958f8f] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-md:ml-auto max-md:size-11 max-md:border-4 md:ml-[calc(var(--u)*92)]"
        >
          <span className="size-[calc(var(--u)*43)] rounded-full bg-[#dadada] max-md:size-4" />
        </Link>
      </nav>
    </header>
  );
}
