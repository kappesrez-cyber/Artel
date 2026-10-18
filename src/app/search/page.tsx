import type { Metadata } from "next";
import Link from "next/link";
import { after, connection } from "next/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { routes } from "@/components/navigation";
import { recordSearch } from "@/server/analytics/events";
import { getCurrentUser } from "@/server/auth/session";
import { searchProducts, type ProductSearchResult } from "@/server/catalog/products";

export const metadata: Metadata = { title: "Результаты поиска" };

const heading =
  "text-[calc(var(--u)*75)] leading-[1.2] font-extrabold tracking-[-0.01em] text-gray-900 max-md:text-3xl";

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
      <h1 className={heading}>{headings[mode]}</h1>
      <SearchNote mode={mode} synonyms={synonyms} corrections={corrections} orderHref={orderHref} />
      <ul className="mt-[calc(var(--u)*30)] grid grid-cols-1 gap-x-[calc(var(--u)*75)] gap-y-[calc(var(--u)*50)] max-md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

/** Пояснение под заголовком: что исправили, по каким синонимам искали, что делать, если точного нет. */
function SearchNote({
  mode,
  synonyms,
  corrections,
  orderHref,
}: Pick<ProductSearchResult, "mode" | "synonyms" | "corrections"> & { orderHref: string }) {
  if (mode === "all") return null;
  const fixes = Object.entries(corrections).map(([word, to]) => `${word} → ${to[0]}`);
  return (
    <div className="mt-[calc(var(--u)*10)] flex flex-wrap items-center gap-x-6 gap-y-2 text-[calc(var(--u)*32)] text-gray-600 max-md:text-base">
      {fixes.length > 0 && <p>Исправили: {fixes.join(", ")}</p>}
      {synonyms.length > 0 && <p>Искали также: {synonyms.slice(0, 6).join(", ")}</p>}
      {mode === "partial" && (
        <Link href={orderHref} className="text-brand font-bold hover:opacity-80">
          Разместить заказ на точную позицию →
        </Link>
      )}
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1 px-[calc(var(--u)*42)] pt-[calc(var(--u)*50)] pb-[calc(var(--u)*60)] max-md:px-3 max-md:pt-6">
      <Suspense fallback={<p className={`${heading} opacity-40`}>Ищем…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
