import Link from "next/link";
import { Logo } from "./Logo";
import { routes } from "./navigation";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Покупателям",
    links: [
      { href: routes.search, label: "Каталог аналогов" },
      { href: routes.searchByPhoto, label: "Поиск по фото" },
      { href: routes.newOrder, label: "Заказ производству" },
      { href: routes.companies, label: "Производители" },
    ],
  },
  {
    title: "Продавцам",
    links: [
      { href: routes.market, label: "Заказы покупателей" },
      { href: routes.register, label: "Регистрация предприятия" },
      { href: routes.pricing, label: "Тарифы" },
    ],
  },
  {
    title: "Artel",
    links: [
      { href: routes.about, label: "О нас" },
      { href: routes.login, label: "Войти" },
    ],
  },
];

/** Подвал сайта: логотип и разделы для покупателей и продавцов. */
export function SiteFooter() {
  return (
    <footer className="bg-brand-dark mt-16 text-white max-md:mt-10">
      <div className="grid w-full gap-10 px-11 py-12 max-md:gap-8 max-md:px-4 max-md:py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Link href={routes.home} aria-label="Artel — на главную" className="self-start">
            <Logo tone="white" className="h-9 w-auto" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            Отечественные аналоги импортных деталей, узлов и ингредиентов. Не нашли готовое —
            закажите производству.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold tracking-wide text-white/50 uppercase">
              {column.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-base text-white/90 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="w-full px-11 py-5 text-sm text-white/50 max-md:px-4">
          © 2026 Artel. Поиск замены импортным комплектующим.
        </p>
      </div>
    </footer>
  );
}
