import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { golos, mursGothic } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Artel",
    template: "%s · Artel",
  },
  description:
    "Инженерно-производственный хаб: поиск отечественной замены импортным комплектующим и промышленная кооперация для AgTech и FoodTech.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${golos.variable} ${mursGothic.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
