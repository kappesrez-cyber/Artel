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
  newRequest: "/request/new",
} as const;

export const mainNav = [
  { href: routes.sellers, label: "Продавцам" },
  { href: routes.buyers, label: "Покупателям" },
  { href: routes.pricing, label: "Тарифы" },
] as const;

export const secondaryNav = [{ href: routes.about, label: "О нас" }] as const;
