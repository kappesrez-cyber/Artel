import Link from "next/link";
import { Suspense, type ComponentType } from "react";
import {
  BearingIcon,
  BeltIcon,
  GearIcon,
  HydraulicsIcon,
  SealIcon,
  WheatIcon,
} from "@/components/icons";
import { routes } from "@/components/navigation";
import { SearchBar } from "@/components/SearchBar";
import { WordRain } from "@/components/WordRain";
import { getCurrentUser } from "@/server/auth/session";

/** Строка поиска с данными вошедшего: ими заполняются контакты в опроснике под «+». */
async function SearchForViewer() {
  const user = await getCurrentUser();
  return <SearchBar viewer={user?.organization ? { name: user.name, email: user.email } : null} />;
}

/** Быстрые запросы под строкой поиска: частые разделы каталога. */
const categories: { label: string; query: string; Icon: ComponentType<{ className?: string }> }[] =
  [
    { label: "Подшипники", query: "подшипник", Icon: BearingIcon },
    { label: "Уплотнения", query: "манжета", Icon: SealIcon },
    { label: "Ремни и цепи", query: "ремень", Icon: BeltIcon },
    { label: "Гидравлика", query: "гидравлический", Icon: HydraulicsIcon },
    { label: "Узлы техники", query: "вал", Icon: GearIcon },
    { label: "Ингредиенты", query: "амилаза", Icon: WheatIcon },
  ];

export default function Home() {
  return (
    <main className="home relative isolate flex flex-1 flex-col items-center justify-center px-4 pt-[calc(var(--u)*48)] pb-[calc(var(--u)*160)] max-md:pt-6">
      <WordRain />
      <div className="relative flex w-full flex-col items-center gap-[calc(var(--u)*24)]">
        {/* Белое свечение за заголовком и поиском: поток слов не мешает читать. */}
        <div
          aria-hidden
          className="absolute -inset-x-[6%] -inset-y-[22%] -z-10 bg-[radial-gradient(closest-side,white_55%,rgb(255_255_255/0.7)_75%,transparent)] max-md:-inset-x-[30%] max-md:-inset-y-[25%]"
        />
        <h1 className="font-display text-center text-[calc(var(--u)*75)] leading-none tracking-[-0.01em] text-gray-900 max-md:text-[28px]">
          Найдём замену импорту
        </h1>
        <p className="max-w-[calc(var(--u)*1000)] text-center text-[calc(var(--u)*32)] leading-snug font-medium text-balance text-gray-600 max-md:text-base">
          Отечественные аналоги деталей, узлов и ингредиентов. Не нашли готовое — закажите
          производству.
        </p>
        <div className="mt-[calc(var(--u)*16)] w-full max-w-[calc(var(--u)*1300)]">
          <Suspense fallback={<SearchBar />}>
            <SearchForViewer />
          </Suspense>
        </div>
        <ul
          aria-label="Частые запросы"
          className="flex max-w-[calc(var(--u)*1300)] flex-wrap justify-center gap-[calc(var(--u)*16)] max-md:gap-2"
        >
          {categories.map(({ label, query, Icon }) => (
            <li key={query}>
              <Link
                href={`${routes.search}?q=${encodeURIComponent(query)}`}
                className="glass group text-brand-dark hover:text-brand focus-visible:outline-brand flex items-center gap-[calc(var(--u)*12)] rounded-full py-[calc(var(--u)*14)] pr-[calc(var(--u)*28)] pl-[calc(var(--u)*16)] text-[calc(var(--u)*26)] font-bold tracking-[-0.02em] transition [--glass-shadow:var(--shadow-soft)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 max-md:px-3 max-md:py-2 max-md:text-sm"
              >
                <span className="bg-brand/10 group-hover:bg-brand grid size-[calc(var(--u)*48)] place-items-center rounded-full transition-colors group-hover:text-white max-md:size-7">
                  <Icon className="size-[calc(var(--u)*30)] max-md:size-4" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
