import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/form";
import { plural } from "@/components/labels";
import { orderHref, routes } from "@/components/navigation";
import { Card, Empty, PageFallback, Section, StarAmount, StatTile } from "@/components/ui";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatMoment } from "@/server/catalog/format";
import { safeNext } from "@/server/forms";
import { starPackages } from "@/server/stars/packages";
import { paymentProvider } from "@/server/stars/payments";
import { getStarBalance, listStarHistory } from "@/server/stars/stars";
import { buyStars } from "./actions";

export const metadata: Metadata = { title: "Звёзды" };

async function Stars({ searchParams }: Pick<PageProps<"/profile/stars">, "searchParams">) {
  const params = await searchParams;
  const user = await requireOrganizationUser(routes.stars);
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next, routes.stars);
  const credited = Number(Array.isArray(params.stars) ? params.stars[0] : params.stars) || 0;
  const [balance, history] = await Promise.all([
    getStarBalance(user.organization.id),
    listStarHistory(user.organization.id),
  ]);
  const isStub = paymentProvider().name === "stub";

  return (
    <div className="flex flex-col gap-10">
      {credited > 0 && (
        <p role="status" className="bg-brand/10 text-brand-dark rounded-2xl px-4 py-3">
          Зачислено {plural(credited, "звезда", "звезды", "звёзд")}.
        </p>
      )}
      <Section title="Звёзды">
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <StatTile label="На счету" value={<StarAmount value={balance} />} />
          <p className="self-center text-gray-600">
            Звёзды поднимают заказ на рынке выше остальных. Вкладывайте их в свои заказы или в
            чужие, если вам нужна такая же позиция: производитель увидит общий спрос и сможет
            сделать поставку сразу для нескольких предприятий.{" "}
            <Link href={routes.market} className="text-brand font-bold hover:opacity-80">
              Заказы на рынке →
            </Link>
          </p>
        </div>
      </Section>

      <Section title="Купить звёзды">
        {isStub && (
          <p className="bg-brand-gray/50 rounded-2xl px-4 py-3 text-gray-800">
            Приём платежей ещё не подключён: оплата пройдёт на тестовой странице без списания денег.
          </p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {starPackages.map((pack) => (
            <li key={pack.stars}>
              <Card className="flex h-full flex-col gap-3 text-center">
                <StarAmount
                  value={pack.stars}
                  className="text-brand-dark text-4xl font-extrabold"
                />
                <span className="text-xl font-bold">{pack.price.toLocaleString("ru-RU")} ₽</span>
                <span className="text-sm text-gray-500">
                  {Math.round(pack.price / pack.stars)} ₽ за звезду
                </span>
                <form action={buyStars.bind(null, pack.stars, next)} className="mt-auto">
                  <button type="submit" className={buttonClass}>
                    Купить
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="История">
        {history.length === 0 ? (
          <Empty>Здесь будут покупки звёзд и продвижения заказов.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 rounded-3xl border-2 border-gray-200">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <span className="flex min-w-0 flex-col">
                  {entry.orderId ? (
                    <Link
                      href={orderHref(entry.orderId)}
                      className="text-brand truncate font-bold hover:opacity-80"
                    >
                      {entry.title}
                    </Link>
                  ) : (
                    <span className="font-bold">{entry.title}</span>
                  )}
                  <span className="text-sm text-gray-500">{formatMoment(entry.at)}</span>
                </span>
                <span
                  className={`text-lg font-extrabold ${entry.stars > 0 ? "text-brand" : "text-gray-600"}`}
                >
                  <StarAmount value={entry.stars > 0 ? `+${entry.stars}` : entry.stars} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/profile/stars">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Stars searchParams={searchParams} />
    </Suspense>
  );
}
