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
  search: "/search",
  searchByPhoto: "/search/photo",
  searchByVoice: "/search/voice",
  newOrder: "/orders/new",
} as const;

/** Страница позиции каталога. */
export const productHref = (id: string) => `/products/${encodeURIComponent(id)}`;

// «Продавцам» убрано из меню по макету: у продавца будет свой режим, страница /sellers остаётся.
export const mainNav = [{ href: routes.buyers, label: "Покупателям" }] as const;

export const secondaryNav = [
  { href: routes.pricing, label: "Тарифы" },
  { href: routes.about, label: "О нас" },
] as const;
