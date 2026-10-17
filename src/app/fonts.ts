import { Golos_Text, Unbounded } from "next/font/google";

/** Основной шрифт интерфейса (меню, строка поиска). */
export const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-golos",
});

/**
 * Заголовки. В макете используется Murs Gothic Wide Dark, которого нет в Google Fonts;
 * Unbounded Black — ближайшая широкая гротескная замена с кириллицей.
 */
export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: "900",
  variable: "--font-unbounded",
});
