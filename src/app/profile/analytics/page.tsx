import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { plural } from "@/components/labels";
import { orderHref, productHref, routes } from "@/components/navigation";
import { Card, Empty, PageFallback, Section, StarAmount, StarCount } from "@/components/ui";
import {
  getBuyerAnalytics,
  getMarketAnalytics,
  getSellerAnalytics,
  type BuyerAnalytics,
  type MarketAnalytics,
  type SellerAnalytics,
} from "@/server/analytics/analytics";
import {
  PERIODS,
  changePercent,
  parsePeriod,
  percent,
  type PeriodDays,
} from "@/server/analytics/metrics";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatPrice } from "@/server/catalog/format";
import { DailyBars } from "./DailyBars";

export const metadata: Metadata = { title: "Аналитика" };

const number = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
const money = (n: number) => formatPrice(n.toFixed(2));

async function Analytics({ searchParams }: Pick<PageProps<"/profile/analytics">, "searchParams">) {
  const { organization } = await requireOrganizationUser("/profile/analytics");
  const period = parsePeriod((await searchParams).period);
  const [seller, buyer, market] = await Promise.all([
    organization.isSeller ? getSellerAnalytics(organization.id, period) : null,
    organization.isBuyer ? getBuyerAnalytics(organization.id, period) : null,
    getMarketAnalytics(organization.id, period),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-[-0.01em] text-gray-900">Аналитика</h2>
        <PeriodTabs current={period} />
      </div>
      {seller && <SellerBlock data={seller} period={period} />}
      {buyer && <BuyerBlock data={buyer} />}
      <MarketBlock data={market} isSeller={organization.isSeller} />
    </div>
  );
}

function PeriodTabs({ current }: { current: PeriodDays }) {
  return (
    <nav aria-label="Период" className="flex gap-1 rounded-full bg-gray-100 p-1">
      {PERIODS.map((days) => (
        <Link
          key={days}
          href={`/profile/analytics?period=${days}`}
          aria-current={days === current ? "page" : undefined}
          className="rounded-full px-4 py-1.5 font-bold text-gray-600 transition-colors hover:text-gray-900 aria-[current=page]:bg-white aria-[current=page]:text-gray-900 aria-[current=page]:shadow-sm"
        >
          {days} дней
        </Link>
      ))}
    </nav>
  );
}

/** Плитка с числом и изменением к прошлому периоду. */
function Kpi({
  label,
  value,
  current,
  previous,
  hint,
}: {
  label: string;
  value: ReactNode;
  current?: number;
  previous?: number;
  hint?: ReactNode;
}) {
  const change =
    current === undefined || previous === undefined ? null : changePercent(current, previous);
  return (
    <div className="from-brand/[0.07] ring-brand/10 flex flex-col gap-1 rounded-3xl bg-linear-to-br to-white p-5 ring-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-brand-dark text-2xl font-extrabold break-words 2xl:text-3xl">
        {value}
      </span>
      {change !== null ? (
        <span className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">
            {change > 0 ? "↑" : change < 0 ? "↓" : "→"} {Math.abs(change)}%
          </span>{" "}
          к прошлому периоду
        </span>
      ) : (
        hint && <span className="text-sm text-gray-500">{hint}</span>
      )}
    </div>
  );
}

/** Горизонтальная полоса доли: длина — значение относительно максимума. */
function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <span className="block h-2.5 w-full rounded-full bg-gray-100">
      <span className="bg-brand block h-full rounded-full" style={{ width: `${width}%` }} />
    </span>
  );
}

function SellerBlock({ data, period }: { data: SellerAnalytics; period: PeriodDays }) {
  const ctr = percent(data.views, data.impressions);
  const funnel: [string, number][] = [
    ["Показы в поиске", data.impressions],
    ["Просмотры карточек", data.views],
    ["Предложения сделок", data.deals.requested],
    ["Принятые", data.deals.accepted],
    ["Успешные", data.deals.completed],
  ];
  const queryMax = Math.max(1, ...data.queries.map((q) => q.n));
  const ratingMax = Math.max(1, ...data.reputation.histogram);

  return (
    <>
      <Section title="Спрос на ваши позиции">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi
            label="Показы в поиске"
            value={number(data.impressions)}
            current={data.impressions}
            previous={data.impressionsPrev}
            hint="Сколько раз позиции попали в выдачу"
          />
          <Kpi
            label="Просмотры карточек"
            value={number(data.views)}
            current={data.views}
            previous={data.viewsPrev}
            hint="Сколько раз открыли карточку"
          />
          <Kpi
            label="Кликабельность"
            value={ctr === null ? "—" : `${ctr}%`}
            hint="Просмотры от показов"
          />
          <Kpi
            label="Выручка"
            value={money(data.deals.revenue)}
            current={data.deals.revenue}
            previous={data.dealsPrev.revenue}
            hint="Успешные сделки за период"
          />
        </div>
        <Card>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-extrabold">Просмотры карточек по дням</h3>
            <span className="text-sm text-gray-500">последние {period} дней</span>
          </div>
          {data.views + data.impressions === 0 ? (
            <Empty>Пока нет показов. Опубликуйте позиции и укажите артикулы аналогов.</Empty>
          ) : (
            <DailyBars points={data.dailyViews} label="Просмотры" />
          )}
        </Card>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Воронка сделок">
          <Card className="flex flex-col gap-3">
            {funnel.map(([label, value], i) => {
              const prev = i > 0 ? funnel[i - 1]![1] : null;
              const conv = prev === null ? null : percent(value, prev);
              return (
                <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                  <span className="font-bold text-gray-800">{label}</span>
                  <span className="text-right">
                    <b>{number(value)}</b>
                    {conv !== null && <span className="ml-2 text-sm text-gray-500">{conv}%</span>}
                  </span>
                  <span className="col-span-2">
                    <Bar
                      value={value}
                      max={funnel[0]![1] || Math.max(...funnel.map((f) => f[1]))}
                    />
                  </span>
                </div>
              );
            })}
            <p className="text-sm text-gray-500">
              {data.deals.averageDays === null
                ? "Средний срок сделки появится после первой успешной."
                : `От предложения до получения в среднем ${plural(data.deals.averageDays, "день", "дня", "дней")}.`}
              {data.deals.completed > 0 &&
                ` Средний чек ${money(data.deals.revenue / data.deals.completed)}.`}
            </p>
          </Card>
        </Section>

        <Section title="По каким запросам вас находят">
          <Card className="flex flex-col gap-3">
            {data.queries.length === 0 ? (
              <p className="text-gray-500">Запросов с вашими позициями за период не было.</p>
            ) : (
              data.queries.map((q) => (
                <div
                  key={q.query}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1"
                >
                  <Link
                    href={`${routes.search}?q=${encodeURIComponent(q.query)}`}
                    className="hover:text-brand truncate font-bold text-gray-800"
                  >
                    {q.query}
                  </Link>
                  <span className="text-right text-sm text-gray-500">
                    <b className="text-gray-900">{q.n}</b> поиск., {q.views} с просмотром
                  </span>
                  <span className="col-span-2">
                    <Bar value={q.n} max={queryMax} />
                  </span>
                </div>
              ))
            )}
          </Card>
        </Section>
      </div>

      <Section title="Позиции">
        {data.products.length === 0 ? (
          <Empty>
            В каталоге пока нет позиций.{" "}
            <Link href="/profile/products/new" className="text-brand font-bold">
              Добавить
            </Link>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-3xl border-2 border-gray-200">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Позиция</th>
                  <th className="px-3 py-3 text-right font-bold">Показы</th>
                  <th className="px-3 py-3 text-right font-bold">Просмотры</th>
                  <th className="px-3 py-3 text-right font-bold">CTR</th>
                  <th className="px-3 py-3 text-right font-bold">Сделки</th>
                  <th className="px-5 py-3 text-right font-bold">Выручка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.products.map((p) => {
                  const rowCtr = percent(p.views, p.impressions);
                  return (
                    <tr key={p.id}>
                      <td className="px-5 py-3">
                        {p.status === "PUBLISHED" ? (
                          <Link href={productHref(p.id)} className="hover:text-brand font-bold">
                            {p.name}
                          </Link>
                        ) : (
                          <span className="font-bold text-gray-500">{p.name} · черновик</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{number(p.impressions)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{number(p.views)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {rowCtr === null ? "—" : `${rowCtr}%`}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{p.deals}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{money(p.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Репутация">
        <Card className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col gap-1">
            <span className="text-brand-dark text-5xl font-extrabold">
              {data.reputation.average ?? "—"}
            </span>
            <span className="text-gray-500">
              {data.reputation.reviews
                ? plural(data.reputation.reviews, "отзыв", "отзыва", "отзывов")
                : "Пока нет отзывов"}
            </span>
            {data.reputation.periodReviews > 0 && (
              <span className="text-sm text-gray-500">
                за период: <StarAmount value={data.reputation.periodAverage} />,{" "}
                {data.reputation.periodReviews} нов.
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3">
                <StarAmount value={stars} className="text-sm font-bold text-gray-600" />
                <Bar value={data.reputation.histogram[stars - 1]!} max={ratingMax} />
                <span className="text-right text-sm tabular-nums">
                  {data.reputation.histogram[stars - 1]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </>
  );
}

function BuyerBlock({ data }: { data: BuyerAnalytics }) {
  return (
    <Section title="Закупки">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi
          label="Потрачено"
          value={money(data.spent)}
          hint={
            data.completed
              ? `${plural(data.completed, "успешная сделка", "успешные сделки", "успешных сделок")}`
              : "Успешных сделок пока нет"
          }
        />
        <Kpi
          label="Поставщиков"
          value={data.sellers}
          hint={`из ${plural(data.deals, "сделки", "сделок", "сделок")} за период`}
        />
        <Kpi
          label="Заказов на рынке"
          value={data.orders.placed}
          hint={
            data.orders.supporters
              ? `${data.orders.open} открыто, поддержали ${plural(data.orders.supporters, "предприятие", "предприятия", "предприятий")}`
              : `${data.orders.open} открыто`
          }
        />
        <Kpi
          label="Звёзды"
          value={<StarAmount value={data.starBalance} />}
          hint={
            data.starsInvested ? (
              <>
                вложено за период: <StarAmount value={data.starsInvested} />
              </>
            ) : (
              "на счету"
            )
          }
        />
      </div>
    </Section>
  );
}

function MarketBlock({ data, isSeller }: { data: MarketAnalytics; isSeller: boolean }) {
  const unmetMax = Math.max(1, ...data.unmet.map((u) => u.n));
  const share = percent(data.emptySearches, data.searches);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Чего не находят в поиске">
        <Card className="flex flex-col gap-3">
          <p className="text-gray-600">
            {data.searches
              ? `${share}% из ${number(data.searches)} запросов на платформе остались без результата.`
              : "Запросов за период не было."}
            {isSeller &&
              data.unmet.length > 0 &&
              " Если вы можете это производить — добавьте в каталог."}
          </p>
          {data.unmet.map((u) => (
            <div key={u.query} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
              <span className="truncate font-bold text-gray-800">{u.query}</span>
              <span className="text-sm text-gray-500">
                <b className="text-gray-900">{u.n}</b> раз
              </span>
              <span className="col-span-2">
                <Bar value={u.n} max={unmetMax} />
              </span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Рынок заказов">
        <Card className="flex flex-col gap-3">
          <p className="text-gray-600">
            Открыто {plural(data.openOrders, "заказ", "заказа", "заказов")}, в них вложено{" "}
            <StarAmount value={data.openOrderStars} />.
          </p>
          {data.topOrders.length === 0 ? (
            <p className="text-gray-500">Других открытых заказов нет.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100">
              {data.topOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={orderHref(o.id)} className="hover:text-brand min-w-0">
                    <span className="block truncate font-bold">{o.title}</span>
                    <span className="text-sm text-gray-500">
                      {[o.quantity != null && `${o.quantity} ${o.unit}`, o.city]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </Link>
                  <StarCount stars={o.stars} />
                </li>
              ))}
            </ul>
          )}
          <Link href={routes.market} className="text-brand self-start font-bold hover:opacity-80">
            Все заказы →
          </Link>
        </Card>
      </Section>
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/profile/analytics">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Analytics searchParams={searchParams} />
    </Suspense>
  );
}
