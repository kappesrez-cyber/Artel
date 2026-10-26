import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { plural } from "@/components/labels";
import { routes } from "@/components/navigation";
import { OrderCard } from "@/components/OrderCard";
import { Empty } from "@/components/ui";
import { listMarketOrders, type MarketSort } from "@/server/orders/orders";

export const metadata: Metadata = { title: "Заказы на рынке" };

const heading =
  "text-[calc(var(--u)*60)] leading-[1.15] font-extrabold tracking-[-0.015em] text-gray-900 max-md:text-3xl";

const sorts: [MarketSort, string][] = [
  ["stars", "По звёздам"],
  ["new", "Новые"],
  ["deadline", "Срочные"],
];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function Orders({ searchParams }: Pick<PageProps<"/market">, "searchParams">) {
  const params = await searchParams;
  const query = first(params.q)?.trim() ?? "";
  const sortParam = first(params.sort);
  const sort = sorts.some(([value]) => value === sortParam) ? (sortParam as MarketSort) : "stars";
  await connection();
  const orders = await listMarketOrders({ query, sort });

  const sortHref = (value: MarketSort) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (value !== "stars") next.set("sort", value);
    const qs = next.toString();
    return qs ? `${routes.market}?${qs}` : routes.market;
  };

  return (
    <>
      <div className="mt-[calc(var(--u)*32)] flex flex-wrap items-center gap-[calc(var(--u)*16)] max-md:mt-5 max-md:gap-3">
        <Form action={routes.market} role="search" className="flex min-w-[min(100%,20rem)] flex-1">
          {sort !== "stars" && <input type="hidden" name="sort" value={sort} />}
          <input
            type="search"
            name="q"
            defaultValue={query}
            aria-label="Поиск по заказам"
            placeholder="Что ищут заказчики: подшипник, насос, упаковка…"
            className="focus:border-brand-dark focus:ring-brand-dark/15 min-w-0 flex-1 rounded-[calc(var(--u)*16)] border-[calc(var(--u)*2)] border-gray-200 bg-white px-[calc(var(--u)*24)] py-[calc(var(--u)*16)] text-[calc(var(--u)*24)] font-semibold text-gray-900 shadow-(--shadow-soft) outline-none placeholder:text-gray-400 focus:ring-4 max-md:rounded-xl max-md:border max-md:px-4 max-md:py-2.5 max-md:text-base"
          />
        </Form>
        <nav
          aria-label="Сортировка"
          className="bg-brand-mist flex max-w-full gap-[calc(var(--u)*6)] overflow-x-auto overscroll-x-contain rounded-[calc(var(--u)*16)] p-[calc(var(--u)*6)] max-md:rounded-xl max-md:p-1"
        >
          {sorts.map(([value, label]) => (
            <Link
              key={value}
              href={sortHref(value)}
              aria-current={value === sort ? "page" : undefined}
              className="text-brand-dark aria-[current=page]:bg-brand-dark rounded-[calc(var(--u)*12)] px-[calc(var(--u)*22)] py-[calc(var(--u)*12)] text-[calc(var(--u)*22)] font-bold whitespace-nowrap transition-colors hover:bg-white aria-[current=page]:text-white max-md:rounded-lg max-md:px-3 max-md:py-1.5 max-md:text-sm"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {orders.length > 0 && (
        <p className="mt-[calc(var(--u)*20)] flex flex-wrap items-center gap-[calc(var(--u)*12)] text-[calc(var(--u)*22)] text-gray-500 max-md:mt-3 max-md:gap-2 max-md:text-sm">
          <span className="bg-brand-dark rounded-full px-[calc(var(--u)*16)] py-[calc(var(--u)*5)] font-bold text-white max-md:px-2.5 max-md:py-0.5">
            {plural(orders.length, "открытый заказ", "открытых заказа", "открытых заказов")}
          </span>
          {sort === "stars" && "Заказы со звёздами — выше."}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="mt-6">
          <Empty>
            {query
              ? `По запросу «${query}» открытых заказов нет.`
              : "Пока никто не разместил заказ. Станьте первым!"}
          </Empty>
        </div>
      ) : (
        <ul className="mt-[calc(var(--u)*32)] grid grid-cols-1 gap-[calc(var(--u)*32)] max-md:mt-5 max-md:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Режим продавца: все открытые заказы, которые выставили заказчики. */
export default function Page({ searchParams }: PageProps<"/market">) {
  return (
    <main className="flex-1 px-[calc(var(--u)*42)] pt-[calc(var(--u)*56)] pb-[calc(var(--u)*60)] max-md:px-3 max-md:pt-6">
      <div className="flex flex-wrap items-end justify-between gap-[calc(var(--u)*30)] border-b border-gray-200 pb-[calc(var(--u)*36)] max-md:gap-4 max-md:pb-5">
        <div className="min-w-0">
          <h1 className={heading}>Заказы на рынке</h1>
          <p className="mt-[calc(var(--u)*16)] max-w-[calc(var(--u)*1000)] text-[calc(var(--u)*24)] leading-[1.4] text-gray-500 max-md:mt-2 max-md:text-base">
            Заказчики не нашли нужную позицию в каталоге и ищут производителя. Откройте заказ, чтобы
            увидеть ТЗ, документы и контакты.
          </p>
        </div>
        <Link
          href={routes.newOrder}
          className="bg-brand-dark hover:bg-brand-navy rounded-[calc(var(--u)*16)] px-[calc(var(--u)*30)] py-[calc(var(--u)*18)] text-[calc(var(--u)*24)] font-bold text-white transition-colors max-md:w-full max-md:rounded-xl max-md:py-2.5 max-md:text-center max-md:text-base"
        >
          Разместить заказ
        </Link>
      </div>
      <Suspense fallback={<p className="mt-8 text-gray-400">Загружаем заказы…</p>}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
