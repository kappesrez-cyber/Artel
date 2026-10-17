import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { plural } from "@/components/labels";
import { requireOrganizationUser } from "@/server/auth/access";
import { listOrganizationProducts } from "@/server/catalog/products";
import { listDeals } from "@/server/deals/deals";
import { listDocuments } from "@/server/organizations/documents";
import { getOrganization, getOrganizationStats } from "@/server/organizations/organizations";
import { Card, PageFallback, Section, StatTile } from "@/components/ui";

export const metadata: Metadata = { title: "Личный кабинет" };

async function Overview({ searchParams }: Pick<PageProps<"/profile">, "searchParams">) {
  const { organization: own } = await requireOrganizationUser();
  const [{ welcome }, organization, stats, deals, documents, products] = await Promise.all([
    searchParams,
    getOrganization(own.id),
    getOrganizationStats(own.id),
    listDeals(own.id),
    listDocuments(own.id),
    own.isSeller ? listOrganizationProducts(own.id) : Promise.resolve([]),
  ]);

  const waiting = deals.filter((d) => d.actions.length > 0 && d.status !== "COMPLETED");
  const toReview = deals.filter((d) => d.canReview);

  // Что ещё не заполнено в профиле: контрагенты охотнее работают с подробными карточками.
  const todo = [
    !organization.description && ["Расскажите, чем занимается предприятие", "/profile/company"],
    !organization.inn && ["Укажите ИНН", "/profile/company"],
    !organization.ogrn && ["Укажите ОГРН", "/profile/company"],
    !(organization.phone || organization.email) && ["Добавьте контакты", "/profile/company"],
    documents.length === 0 && ["Загрузите первый документ или отчёт", "/profile/documents"],
    own.isSeller &&
      products.length === 0 && ["Добавьте позицию в каталог", "/profile/products/new"],
  ].filter((item): item is [string, string] => Boolean(item));

  return (
    <div className="flex flex-col gap-10">
      {welcome && (
        <Card className="border-brand bg-brand/5">
          <p className="text-lg font-bold">Аккаунт предприятия создан.</p>
          <p className="text-gray-600">
            Заполните профиль и документы: их увидят контрагенты на публичной странице.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Успешных сделок" value={stats.successfulDeals} />
        <StatTile
          label="Рейтинг"
          value={stats.averageRating ?? "—"}
          hint={
            stats.reviewsCount
              ? plural(stats.reviewsCount, "отзыв", "отзыва", "отзывов")
              : "Пока нет отзывов"
          }
        />
        <StatTile
          label="Сделок в работе"
          value={deals.filter((d) => d.status === "ACCEPTED").length}
        />
        {own.isSeller ? (
          <StatTile
            label="Позиций в каталоге"
            value={products.filter((p) => p.status === "PUBLISHED").length}
            hint={`всего ${products.length}, с черновиками`}
          />
        ) : (
          <StatTile label="Документов" value={documents.length} />
        )}
      </div>

      {(waiting.length > 0 || toReview.length > 0) && (
        <Section title="Ждут вашего действия">
          <ul className="flex flex-col gap-2">
            {waiting.map((deal) => (
              <li key={deal.id}>
                <Link href="/profile/deals" className="text-brand font-bold hover:opacity-80">
                  {deal.title} · {deal.counterpart.name}
                </Link>{" "}
                <span className="text-gray-500">
                  {deal.side === "seller" && deal.status === "REQUESTED"
                    ? "— новое предложение"
                    : deal.side === "buyer" && deal.status === "ACCEPTED"
                      ? "— подтвердите получение"
                      : "— можно отменить"}
                </span>
              </li>
            ))}
            {toReview.map((deal) => (
              <li key={`r-${deal.id}`}>
                <Link href="/profile/deals" className="text-brand font-bold hover:opacity-80">
                  Оставьте отзыв о «{deal.counterpart.name}»
                </Link>{" "}
                <span className="text-gray-500">по сделке «{deal.title}»</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {todo.length > 0 && (
        <Section title="Заполните профиль">
          <ul className="grid gap-3 sm:grid-cols-2">
            {todo.map(([text, href]) => (
              <li key={text}>
                <Link
                  href={href}
                  className="hover:border-brand flex h-full items-center rounded-3xl border-2 border-gray-200 px-5 py-4 font-bold transition-colors"
                >
                  {text}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/profile">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}
