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

const heading = "text-3xl leading-tight font-extrabold text-gray-900 max-md:text-2xl";

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
      <div className="mx-auto flex max-w-3xl flex-col gap-2 py-8">
        <h1 className={heading}>
          {query ? `По запросу «${query}» ничего не найдено` : "Пока нет предложений"}
        </h1>
        <p className="text-base text-gray-500">
          Проверьте написание или поищите по артикулу импортной детали.
        </p>
        <OrderBanner href={orderHref} />
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2 border-b border-gray-200 pb-5">
        <h1 className={heading}>
          {query ? `«${query}»` : "Все предложения"}{" "}
          <span className="font-bold whitespace-nowrap text-gray-400">
            {plural(products.length, "предложение", "предложения", "предложений")}
          </span>
        </h1>
        <SearchNote
          mode={mode}
          synonyms={synonyms}
          corrections={corrections}
          orderHref={orderHref}
        />
      </section>
      <ul className="mt-6 grid grid-cols-2 gap-4 max-sm:gap-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} now={now} />
          </li>
        ))}
      </ul>
      <OrderBanner href={orderHref} />
    </>
  );
}

/** Внизу выдачи, как у hh.ru и Яндекса: не нашли — разместите заказ. */
function OrderBanner({ href }: { href: string }) {
  return (
    <section className="bg-brand-mist mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 max-md:p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg font-extrabold text-gray-900">Не нашли нужную деталь?</h2>
        <p className="text-base text-gray-600">
          Разместите заказ — производства сами предложат цену и сроки.
        </p>
      </div>
      <Link
        href={href}
        className="bg-brand-dark hover:bg-brand-navy rounded-xl px-6 py-2.5 text-base font-bold text-white transition-colors max-md:w-full max-md:text-center"
      >
        Разместить заказ
      </Link>
    </section>
  );
}

/**
 * Пояснение под заголовком одной строкой простого текста, как в Яндексе:
 * что исправили, что точных совпадений нет и по каким синонимам искали.
 */
function SearchNote({
  mode,
  synonyms,
  corrections,
  orderHref,
}: Pick<ProductSearchResult, "mode" | "synonyms" | "corrections"> & { orderHref: string }) {
  if (mode === "all") return null;
  const fixes = Object.entries(corrections).map(([word, to]) => `${word} → ${to[0]}`);
  const parts: ReactNode[] = [];
  if (mode === "partial") {
    parts.push(
      <span key="partial">
        Точных совпадений нет, показываем похожие.{" "}
        <Link href={orderHref} className="text-brand-dark font-bold hover:underline">
          Заказать точную позицию
        </Link>
      </span>,
    );
  }
  if (fixes.length > 0) {
    parts.push(<span key="fixes">Исправили опечатку: {fixes.join(", ")}</span>);
  }
  if (synonyms.length > 0) {
    parts.push(
      <span key="synonyms">
        Искали также:{" "}
        {synonyms.slice(0, 6).map((word, i) => (
          <span key={word}>
            {i > 0 && ", "}
            <Link
              href={`${routes.search}?q=${encodeURIComponent(word)}`}
              className="text-brand-dark font-bold hover:underline"
            >
              {word}
            </Link>
          </span>
        ))}
      </span>,
    );
  }
  if (parts.length === 0) return null;
  return <p className="flex flex-wrap gap-x-4 gap-y-1 text-base text-gray-500">{parts}</p>;
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1 px-6 pt-8 max-md:px-3 max-md:pt-6">
      <Suspense fallback={<p className={`${heading} opacity-40`}>Ищем…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
