import { Golos_Text } from "next/font/google";
import localFont from "next/font/local";

/** Основной шрифт интерфейса (меню, строка поиска). */
export const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-golos",
});

/** Заголовки: Murs Gothic Wide Dark (Maksym Kobuzan), как в макете. */
export const mursGothic = localFont({
  src: "./fonts/MursGothic-WideDark.ttf",
  variable: "--font-murs-gothic",
  display: "swap",
});
