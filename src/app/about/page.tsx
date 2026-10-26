import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/components/navigation";

export const metadata: Metadata = { title: "О нас" };

const facts = [
  { label: "Команда", value: "«Груша»" },
  { label: "Кейс-чемпионат", value: "«Ключ» НИУ ВШЭ" },
  { label: "Сезон", value: "2026–2027" },
];

const points = [
  {
    title: "Что делаем",
    text: "Artel помогает предприятиям АПК и пищевой промышленности найти отечественную замену импортным комплектующим: по названию, артикулу или фото детали.",
  },
  {
    title: "Для кого",
    text: "Заказчикам — агрохолдингам и пищевым заводам — платформа бесплатна. Производители и цеха получают заказы, аналитику спроса и собираются в пулы под крупные объёмы.",
  },
  {
    title: "Почему нам можно доверять",
    text: "Каждого производителя проверяет ИИ-сводка: реквизиты, история сделок, отзывы, отчётность и внешние реестры. Итог — индекс доверия от 0 до 100.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 md:px-8 md:py-14">
      <section className="bg-brand-dark relative overflow-hidden rounded-[2rem] px-6 py-8 text-white shadow-[var(--shadow-lift)] md:px-12 md:py-12">
        <p className="text-sm font-bold tracking-wide text-white/70 uppercase">О нас</p>
        <h1 className="font-display mt-2 text-4xl leading-tight md:text-6xl">Команда «Груша»</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/85 md:text-xl">
          Artel — проект команды «Груша» для кейс-чемпионата НИУ ВШЭ «Ключ» 2026–2027.
        </p>
        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white/10 px-5 py-4">
              <dt className="text-sm text-white/70">{f.label}</dt>
              <dd className="mt-1 text-xl font-extrabold">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ul className="grid gap-5 md:grid-cols-3">
        {points.map((p) => (
          <li
            key={p.title}
            className="flex flex-col gap-2 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-[var(--shadow-soft)]"
          >
            <h2 className="text-brand-dark text-xl font-extrabold">{p.title}</h2>
            <p className="text-gray-700">{p.text}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={routes.home}
          className="bg-brand rounded-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-85"
        >
          Попробовать поиск
        </Link>
        <Link
          href={routes.pricing}
          className="border-brand-dark/25 text-brand-dark hover:border-brand-dark rounded-full border-2 px-6 py-3 font-bold transition-colors"
        >
          Тарифы
        </Link>
      </div>
    </main>
  );
}
