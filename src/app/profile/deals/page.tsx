import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { dealStatusLabels } from "@/components/labels";
import { companyHref, productHref, routes } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatMoment, formatPrice } from "@/server/catalog/format";
import { listDeals, type DealView } from "@/server/deals/deals";
import { Badge, Card, Empty, PageFallback, Section } from "@/components/ui";
import { DealActions } from "./DealActions";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Сделки" };

const statusTone = {
  REQUESTED: "amber",
  ACCEPTED: "brand",
  COMPLETED: "green",
  CANCELLED: "gray",
} as const;

function DealCard({ deal }: { deal: DealView }) {
  const total = deal.unitPrice && formatPrice((Number(deal.unitPrice) * deal.quantity).toFixed(2));
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
      {deal.canReview && <ReviewForm dealId={deal.id} counterpart={deal.counterpart.name} />}
    </Card>
  );
}

async function Deals() {
  const { organization } = await requireOrganizationUser("/profile/deals");
  const deals = await listDeals(organization.id);
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
                  <DealCard deal={deal} />
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
                  <DealCard deal={deal} />
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
                <DealCard deal={deal} />
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
