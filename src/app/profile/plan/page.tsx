import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { routes } from "@/components/navigation";
import { Card, PageFallback, Section, StarAmount, StatTile } from "@/components/ui";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatDate, formatPrice } from "@/server/catalog/format";
import { getPlan } from "@/server/plans/plans";
import { getOrganizationPlan, listPlanPayments } from "@/server/plans/subscriptions";

export const metadata: Metadata = { title: "Тариф" };

async function PlanOverview({ searchParams }: Pick<PageProps<"/profile/plan">, "searchParams">) {
  const params = await searchParams;
  const user = await requireOrganizationUser(routes.plan);
  const [current, payments] = await Promise.all([
    getOrganizationPlan(user.organization.id),
    listPlanPayments(user.organization.id),
  ]);
  const plan = getPlan(current.tier);
  const paid = typeof params.paid === "string" ? params.paid : null;

  return (
    <div className="flex flex-col gap-10">
      {paid && (
        <p role="status" className="bg-brand/10 text-brand-dark rounded-2xl px-4 py-3">
          Оплачено: тариф {plan.name} подключён
          {plan.bonusStars > 0 && `, на счёт зачислено ${plan.bonusStars} бонусных звёзд`}.
        </p>
      )}
      <Section
        title="Тариф"
        action={
          <Link href={routes.pricing} className="text-brand font-bold hover:opacity-80">
            Все тарифы и сравнение →
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Сейчас"
            value={plan.name}
            hint={current.until ? `оплачен до ${formatDate(current.until)}` : "бесплатно"}
          />
          <StatTile label="Комиссия" value={`${plan.commission}%`} hint="с суммы успешной сделки" />
          <StatTile
            label="Бонус в месяц"
            value={<StarAmount value={plan.bonusStars} />}
            hint="зачисляется при оплате"
          />
          <StatTile
            label="Приоритет в поиске"
            value={plan.searchBoost ? `+${Math.round(plan.searchBoost * 100)}%` : "—"}
            hint={plan.docsHelp ? "и помощь юриста со сделками" : "среди равных предложений"}
          />
        </div>
      </Section>

      <Section title="Оплаты">
        {payments.length === 0 ? (
          <p className="text-gray-500">
            Оплат ещё не было.{" "}
            <Link href={routes.pricing} className="text-brand font-bold">
              Выбрать тариф →
            </Link>
          </p>
        ) : (
          <Card className="p-0 md:p-0">
            <ul className="divide-y divide-gray-100">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-4 px-5 py-3">
                  <span>
                    <span className="font-bold">{getPlan(p.plan).name}</span>, месяц
                    <span className="block text-sm text-gray-500">
                      {p.paidAt && formatDate(p.paidAt)}
                    </span>
                  </span>
                  <span className="font-bold">{formatPrice(p.amount.toFixed(2))}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>
    </div>
  );
}

export default function Page(props: PageProps<"/profile/plan">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <PlanOverview searchParams={props.searchParams} />
    </Suspense>
  );
}
