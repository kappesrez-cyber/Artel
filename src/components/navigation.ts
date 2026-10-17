/**
 * Все адреса, на которые ведут кнопки шапки и строки поиска.
 * Пока за каждым из них стоит страница-заглушка; тест проверяет, что страница существует.
 */
export const routes = {
  home: "/",
  sellers: "/sellers",
  buyers: "/buyers",
  pricing: "/pricing",
  about: "/about",
  profile: "/profile",
  login: "/login",
  register: "/register",
  search: "/search",
  searchByPhoto: "/search/photo",
  searchByVoice: "/search/voice",
  newOrder: "/orders/new",
  market: "/market",
  myOrders: "/profile/orders",
  stars: "/profile/stars",
} as const;

/** Публичная страница предприятия. */
export const companyHref = (id: string) => `/companies/${encodeURIComponent(id)}`;

/** Страница позиции каталога. */
export const productHref = (id: string) => `/products/${encodeURIComponent(id)}`;

/** Заказ на рынке. */
export const orderHref = (id: string) => `/market/${encodeURIComponent(id)}`;

/**
 * Ползунок режима в шапке (макет «Стартовая страница»): покупатель ищет в каталоге,
 * предприятие в режиме продавца смотрит заказы на рынке. Режим определяется адресом.
 */
export const modes = [
  { mode: "buyer", href: routes.home, label: "Покупателям" },
  { mode: "seller", href: routes.market, label: "Продавцам" },
] as const;

export type Mode = (typeof modes)[number]["mode"];

export function modeForPath(pathname: string): Mode {
  return pathname === routes.market || pathname.startsWith(`${routes.market}/`)
    ? "seller"
    : "buyer";
}

export const secondaryNav = [
  { href: routes.pricing, label: "Тарифы" },
  { href: routes.about, label: "О нас" },
] as const;
