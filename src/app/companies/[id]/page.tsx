import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { documentKindLabels, plural } from "@/components/labels";
import { ProductCard } from "@/components/ProductCard";
import { ReviewList } from "@/components/ReviewList";
import {
  Badge,
  Card,
  Empty,
  PageFallback,
  RoleBadges,
  Section,
  Stars,
  StatTile,
} from "@/components/ui";
import { formatDate } from "@/server/catalog/format";
import { listPublishedOrganizationProducts } from "@/server/catalog/products";
import { getPublicProfile } from "@/server/organizations/organizations";

export const metadata: Metadata = { title: "Предприятие" };

async function Company({ params }: Pick<PageProps<"/companies/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const [company, products] = await Promise.all([
    getPublicProfile(id),
    listPublishedOrganizationProducts(id),
  ]);
  if (!company) notFound();
  const { stats } = company;
  const now = new Date();

  const facts = [
    ["ИНН", company.inn],
    ["ОГРН", company.ogrn],
    ["Город", company.city],
    ["Адрес", company.legalAddress],
    ["Год основания", company.foundedYear],
    ["Телефон", company.phone],
    ["Email", company.email],
  ].filter((fact): fact is [string, string | number] => fact[1] !== null && fact[1] !== "");

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-brand-dark text-3xl leading-tight md:text-5xl">
          {company.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadges isSeller={company.isSeller} isBuyer={company.isBuyer} />
          {company.verifiedAt && <Badge tone="green">Реквизиты проверены</Badge>}
        </div>
        {company.description && (
          <p className="max-w-3xl text-lg whitespace-pre-line text-gray-700">
            {company.description}
          </p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Успешных сделок на Artel" value={stats.successfulDeals} />
        <StatTile
          label="Рейтинг"
          value={
            stats.averageRating === null ? (
              "—"
            ) : (
              <span className="flex items-center gap-3">
                {stats.averageRating} <Stars rating={stats.averageRating} />
              </span>
            )
          }
          hint={
            stats.reviewsCount
              ? plural(stats.reviewsCount, "отзыв", "отзыва", "отзывов")
              : "Пока нет отзывов"
          }
        />
        <StatTile label="На платформе с" value={company.createdAt.getFullYear()} />
      </div>

      {(facts.length > 0 || company.website) && (
        <Section title="Реквизиты и контакты">
          <Card>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
              {facts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-bold break-words">{value}</dd>
                </div>
              ))}
              {company.website && (
                <div className="contents">
                  <dt className="text-gray-500">Сайт</dt>
                  <dd>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer nofollow"
                      className="text-brand font-bold break-all"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </Section>
      )}

      {company.isSeller && (
        <Section title="Каталог">
          {products.length === 0 ? (
            <Empty>Предприятие ещё не опубликовало позиции.</Empty>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} now={now} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Документы и отчёты">
        {company.documents.length === 0 ? (
          <Empty>Предприятие пока не открыло документы.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {company.documents.map((doc) => (
              <li key={doc.id}>
                <Card className="flex h-full flex-col gap-1">
                  <span className="text-sm text-gray-500">{documentKindLabels[doc.kind]}</span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer nofollow"
                      className="text-brand font-bold hover:opacity-80"
                    >
                      {doc.title}
                    </a>
                  ) : (
                    <span className="font-bold">{doc.title}</span>
                  )}
                  <span className="text-sm text-gray-600">
                    {[
                      doc.number && `№ ${doc.number}`,
                      doc.issuedAt && `от ${formatDate(doc.issuedAt)}`,
                      doc.validUntil && `до ${formatDate(doc.validUntil)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Отзывы контрагентов">
        {company.reviewsReceived.length === 0 ? (
          <Empty>Отзывов пока нет. Их оставляют только после успешной сделки на платформе.</Empty>
        ) : (
          <ReviewList
            reviews={company.reviewsReceived.map((r) => ({
              ...r,
              organization: r.authorOrganization,
            }))}
          />
        )}
      </Section>
    </div>
  );
}

export default function Page({ params }: PageProps<"/companies/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <Suspense fallback={<PageFallback />}>
        <Company params={params} />
      </Suspense>
      <Link href="/search" className="text-brand self-start font-bold hover:opacity-80">
        ← К поиску
      </Link>
    </main>
  );
}
