import type { Metadata } from "next";
import Link from "next/link";
import { after, connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ProductCard } from "@/components/ProductCard";
import { plural } from "@/components/labels";
import { routes } from "@/components/navigation";
import { recordSearch } from "@/server/analytics/events";
import { getCurrentUser } from "@/server/auth/session";
import { searchProducts, type ProductSearchResult } from "@/server/catalog/products";

export const metadata: Metadata = { title: "Результаты поиска" };

const heading =
  "text-[calc(var(--u)*60)] leading-[1.15] font-extrabold tracking-[-0.015em] text-gray-900 max-md:text-3xl";

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  await connection();
  const [{ items: products, mode, synonyms, corrections }, viewer] = await Promise.all([
    searchProducts(query),
    getCurrentUser(),
  ]);
  after(() => recordSearch(query, products, viewer?.organization?.id ?? null));
  // Даты готовности считаются от момента просмотра.
  const now = new Date();
  const orderHref = query ? `${routes.newOrder}?q=${encodeURIComponent(query)}` : routes.newOrder;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-[calc(var(--u)*30)] text-center">
        <h1 className={heading}>К сожалению, по запросу ничего не найдено</h1>
        {query && (
          <p className="text-[calc(var(--u)*48)] leading-none font-bold tracking-[-0.04em] max-md:text-xl">
            «{query}»
          </p>
        )}
        <Link
          href={orderHref}
          className="bg-brand-dark mt-[calc(var(--u)*60)] w-full max-w-[calc(var(--u)*1643)] rounded-[calc(var(--u)*35)] px-[calc(var(--u)*66)] py-[calc(var(--u)*58)] text-[calc(var(--u)*75)] leading-none font-extrabold tracking-[-0.01em] text-white transition-opacity hover:opacity-90 max-md:p-5 max-md:text-2xl"
        >
          Хотите разместить карточку на заказ?
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-[calc(var(--u)*30)] border-b border-gray-200 pb-[calc(var(--u)*36)] max-md:gap-4 max-md:pb-5">
        <div className="min-w-0">
          <h1 className={heading}>{headings[mode]}</h1>
          <div className="mt-[calc(var(--u)*18)] flex flex-wrap items-center gap-[calc(var(--u)*12)] max-md:mt-3 max-md:gap-2">
            {query && (
              <span className="bg-brand-dark rounded-full px-[calc(var(--u)*20)] py-[calc(var(--u)*8)] text-[calc(var(--u)*24)] font-bold text-white max-md:px-3 max-md:py-1 max-md:text-sm">
                «{query}»
              </span>
            )}
            <span className="text-[calc(var(--u)*24)] font-semibold text-gray-500 max-md:text-sm">
              {plural(products.length, "предложение", "предложения", "предложений")}
            </span>
          </div>
          <SearchNote mode={mode} synonyms={synonyms} corrections={corrections} />
        </div>
        <Link
          href={orderHref}
          className="border-brand-dark text-brand-dark hover:bg-brand-dark flex items-center gap-[calc(var(--u)*12)] rounded-[calc(var(--u)*16)] border-[calc(var(--u)*2)] px-[calc(var(--u)*26)] py-[calc(var(--u)*16)] text-[calc(var(--u)*24)] font-bold transition-colors hover:text-white max-md:w-full max-md:justify-center max-md:rounded-xl max-md:border max-md:py-2.5 max-md:text-base"
        >
          {mode === "partial"
            ? "Разместить заказ на точную позицию"
            : "Не нашли нужное? Разместить заказ"}
        </Link>
      </section>
      <ul className="mt-[calc(var(--u)*40)] grid grid-cols-1 gap-[calc(var(--u)*32)] max-md:mt-5 max-md:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} now={now} />
          </li>
        ))}
      </ul>
    </>
  );
}

const headings: Record<ProductSearchResult["mode"], string> = {
  all: "Все предложения:",
  exact: "Найдено по вашему запросу:",
  typos: "Найдено с исправлением запроса:",
  partial: "Точных совпадений нет, похожие предложения:",
};

/** Пояснение под заголовком: что исправили и по каким синонимам искали. */
function SearchNote({
  mode,
  synonyms,
  corrections,
}: Pick<ProductSearchResult, "mode" | "synonyms" | "corrections">) {
  if (mode === "all") return null;
  const fixes = Object.entries(corrections).map(([word, to]) => `${word} → ${to[0]}`);
  if (fixes.length === 0 && synonyms.length === 0) return null;
  return (
    <div className="mt-[calc(var(--u)*16)] flex flex-wrap items-center gap-[calc(var(--u)*10)] text-[calc(var(--u)*22)] text-gray-500 max-md:mt-3 max-md:gap-1.5 max-md:text-sm">
      {fixes.length > 0 && (
        <>
          <span>Исправили:</span>
          {fixes.map((fix) => (
            <Chip key={fix}>{fix}</Chip>
          ))}
        </>
      )}
      {synonyms.length > 0 && (
        <>
          <span className={fixes.length > 0 ? "ml-[calc(var(--u)*12)]" : undefined}>
            Искали также:
          </span>
          {synonyms.slice(0, 6).map((word) => (
            <Chip key={word}>{word}</Chip>
          ))}
        </>
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="bg-brand-mist text-brand-dark rounded-full px-[calc(var(--u)*14)] py-[calc(var(--u)*4)] font-semibold max-md:px-2.5 max-md:py-0.5">
      {children}
    </span>
  );
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1 px-[calc(var(--u)*42)] pt-[calc(var(--u)*56)] pb-[calc(var(--u)*60)] max-md:px-3 max-md:pt-6">
      <Suspense fallback={<p className={`${heading} opacity-40`}>Ищем…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
