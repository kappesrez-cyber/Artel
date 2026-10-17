import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { buttonClass } from "@/components/form";
import { plural } from "@/components/labels";
import { routes } from "@/components/navigation";
import { OrderCard } from "@/components/OrderCard";
import { Empty } from "@/components/ui";
import { listMarketOrders, type MarketSort } from "@/server/orders/orders";

export const metadata: Metadata = { title: "Заказы на рынке" };

const heading =
  "text-[calc(var(--u)*75)] leading-[1.2] font-extrabold tracking-[-0.01em] text-gray-900 max-md:text-3xl";

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
      <div className="mt-[calc(var(--u)*24)] flex flex-wrap items-center gap-3">
        <Form
          action={routes.market}
          role="search"
          className="flex min-w-[min(100%,20rem)] flex-1 gap-2"
        >
          {sort !== "stars" && <input type="hidden" name="sort" value={sort} />}
          <input
            type="search"
            name="q"
            defaultValue={query}
            aria-label="Поиск по заказам"
            placeholder="Что ищут заказчики: подшипник, насос, упаковка…"
            className="bg-brand-gray min-w-0 flex-1 rounded-full px-5 py-3 text-lg font-bold tracking-[-0.02em] outline-none placeholder:text-black/35"
          />
        </Form>
        <nav aria-label="Сортировка" className="flex gap-1 rounded-full bg-gray-100 p-1">
          {sorts.map(([value, label]) => (
            <Link
              key={value}
              href={sortHref(value)}
              aria-current={value === sort ? "page" : undefined}
              className="rounded-full px-4 py-2 font-bold whitespace-nowrap text-gray-600 transition-colors hover:text-black aria-[current=page]:bg-white aria-[current=page]:text-black aria-[current=page]:shadow"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-4 text-gray-500">
        {orders.length
          ? `${plural(orders.length, "открытый заказ", "открытых заказа", "открытых заказов")}. Заказы со звёздами — выше.`
          : null}
      </p>

      {orders.length === 0 ? (
        <div className="mt-6">
          <Empty>
            {query
              ? `По запросу «${query}» открытых заказов нет.`
              : "Пока никто не разместил заказ. Станьте первым!"}
          </Empty>
        </div>
      ) : (
        <ul className="mt-[calc(var(--u)*30)] grid gap-x-[calc(var(--u)*75)] gap-y-[calc(var(--u)*50)] max-md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <main className="flex-1 px-[calc(var(--u)*42)] pt-[calc(var(--u)*50)] pb-[calc(var(--u)*60)] max-md:px-3 max-md:pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={heading}>Заказы на рынке</h1>
          <p className="mt-2 max-w-3xl text-lg text-gray-600">
            Заказчики не нашли нужную позицию в каталоге и ищут производителя. Откройте заказ, чтобы
            увидеть ТЗ, документы и контакты.
          </p>
        </div>
        <Link href={routes.newOrder} className={buttonClass}>
          Разместить заказ
        </Link>
      </div>
      <Suspense fallback={<p className="mt-8 text-gray-400">Загружаем заказы…</p>}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
