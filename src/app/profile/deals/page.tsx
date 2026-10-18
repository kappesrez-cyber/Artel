import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { dealStatusLabels } from "@/components/labels";
import { companyHref, productHref, routes } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatMoment, formatPrice } from "@/server/catalog/format";
import { listDeals, type DealView } from "@/server/deals/deals";
import { Badge, Card, Empty, PageFallback, Section } from "@/components/ui";
import { getPlan, type Plan } from "@/server/plans/plans";
import { getOrganizationPlan } from "@/server/plans/subscriptions";
import { DealActions } from "./DealActions";
import { DocsHelp } from "./DocsHelp";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Сделки" };

const statusTone = {
  REQUESTED: "outline",
  ACCEPTED: "brand",
  COMPLETED: "solid",
  CANCELLED: "gray",
} as const;

function DealCard({ deal, plan }: { deal: DealView; plan: Plan }) {
  const sum = deal.unitPrice ? Number(deal.unitPrice) * deal.quantity : null;
  const total = sum !== null && formatPrice(sum.toFixed(2));
  // Комиссию платит продавец; считаем по его тарифу на сегодня.
  const commission =
    deal.side === "seller" && sum !== null && deal.status !== "CANCELLED"
      ? Math.round(sum * plan.commission) / 100
      : null;
  const docsHelpAvailable =
    deal.status === "ACCEPTED" || deal.status === "COMPLETED"
      ? plan.docsHelp || Boolean(deal.docsHelpRequestedAt)
      : false;
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {deal.productId ? (
            <Link href={productHref(deal.productId)} className="text-lg font-bold hover:opacity-80">
              {deal.title}
            </Link>
          ) : (
            <span className="text-lg font-bold">{deal.title}</span>
          )}
          <span className="text-gray-600">
            {deal.side === "seller" ? "Покупатель" : "Продавец"}:{" "}
            <Link href={companyHref(deal.counterpart.id)} className="text-brand font-bold">
              {deal.counterpart.name}
            </Link>
          </span>
          <span className="text-gray-600">
            {deal.quantity} шт.
            {deal.unitPrice && ` × ${formatPrice(deal.unitPrice)} = ${total}`}
          </span>
          {commission !== null && (
            <span className="text-sm text-gray-500">
              Комиссия платформы по тарифу {plan.name} ({plan.commission}%):{" "}
              {formatPrice(commission.toFixed(2))}.{" "}
              <Link href={routes.pricing} className="text-brand font-bold">
                Тарифы
              </Link>
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm text-gray-500">
          <Badge tone={statusTone[deal.status]}>{dealStatusLabels[deal.status]}</Badge>
          <span>от {formatMoment(deal.createdAt)}</span>
          {deal.completedAt && <span>завершена {formatMoment(deal.completedAt)}</span>}
        </div>
      </div>
      {deal.comment && (
        <p className="rounded-2xl bg-gray-50 px-4 py-3 text-gray-700">«{deal.comment}»</p>
      )}
      <DealActions dealId={deal.id} actions={deal.actions} />
      {docsHelpAvailable && (
        <DocsHelp dealId={deal.id} requestedAt={deal.docsHelpRequestedAt?.toISOString() ?? null} />
      )}
      {deal.canReview && <ReviewForm dealId={deal.id} counterpart={deal.counterpart.name} />}
    </Card>
  );
}

async function Deals() {
  const { organization } = await requireOrganizationUser("/profile/deals");
  const [deals, current] = await Promise.all([
    listDeals(organization.id),
    getOrganizationPlan(organization.id),
  ]);
  const plan = getPlan(current.tier);
  const selling = deals.filter((d) => d.side === "seller");
  const buying = deals.filter((d) => d.side === "buyer");
  return (
    <div className="flex flex-col gap-10">
      {organization.isSeller && (
        <Section title="Продаём">
          {selling.length === 0 ? (
            <Empty>Здесь появятся предложения покупателей по вашим позициям.</Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {selling.map((deal) => (
                <li key={deal.id}>
                  <DealCard deal={deal} plan={plan} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
      {(organization.isBuyer || buying.length > 0) && (
        <Section title="Покупаем">
          {buying.length === 0 ? (
            <Empty>
              Найдите позицию через{" "}
              <Link href={routes.search} className="text-brand font-bold">
                поиск
              </Link>{" "}
              и предложите производителю сделку.
            </Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {buying.map((deal) => (
                <li key={deal.id}>
                  <DealCard deal={deal} plan={plan} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
      {!organization.isSeller && selling.length > 0 && (
        <Section title="Продавали раньше">
          <ul className="flex flex-col gap-3">
            {selling.map((deal) => (
              <li key={deal.id}>
                <DealCard deal={deal} plan={plan} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Deals />
    </Suspense>
  );
}
