import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after, connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { buttonClass } from "@/components/form";
import { companyHref, routes } from "@/components/navigation";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate, formatPrice, readyDate } from "@/server/catalog/format";
import { getPublishedProduct, type ProductView } from "@/server/catalog/products";
import { recordProductView } from "@/server/analytics/events";
import { DealOfferForm } from "./DealOfferForm";

export const metadata: Metadata = { title: "Позиция каталога" };

async function Product({ params }: Pick<PageProps<"/products/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const product = await getPublishedProduct(id);
  if (!product) notFound();
  // Просмотр записываем после ответа, чтобы не задерживать страницу.
  const viewer = await getCurrentUser();
  after(() => recordProductView(product, viewer?.organization?.id ?? null));

  const facts: [string, ReactNode][] = [
    [
      "Производитель",
      <Link
        key="org"
        href={companyHref(product.organization.id)}
        className="text-brand hover:opacity-80"
      >
        {product.organization.name}
      </Link>,
    ],
    ...(product.article ? [["Артикул", product.article] as [string, ReactNode]] : []),
    ...(product.analogs ? [["Заменяет", product.analogs] as [string, ReactNode]] : []),
    ["Город", product.city],
    ["Срок производства", `${product.leadTimeDays} дн.`],
    ["Будет готово", formatDate(readyDate(product.leadTimeDays))],
    ["Цена", formatPrice(product.price)],
  ];

  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-4xl font-extrabold tracking-[-0.01em] text-gray-900 md:text-5xl">
        {product.name}
      </h1>
      {product.description && <p className="text-lg text-gray-600">{product.description}</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-xl">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-600">{label}</dt>
            <dd className="font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <Suspense>
        <DealOffer product={product} />
      </Suspense>
    </article>
  );
}

/** Блок сделки: форма для покупателя, подсказка для всех остальных. */
async function DealOffer({ product }: { product: ProductView }) {
  const user = await getCurrentUser();
  let body: ReactNode;
  if (!user?.organization) {
    body = (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-lg">Войдите от имени предприятия, чтобы предложить сделку.</p>
        <Link
          href={`${routes.login}?next=${encodeURIComponent(`/products/${product.id}`)}`}
          className={buttonClass}
        >
          Войти
        </Link>
      </div>
    );
  } else if (user.organization.id === product.organization.id) {
    body = (
      <p className="text-lg">
        Это ваша позиция.{" "}
        <Link href={`/profile/products/${product.id}`} className="text-brand font-bold">
          Изменить
        </Link>
      </p>
    );
  } else if (!user.organization.isBuyer) {
    body = (
      <p className="text-lg">
        Чтобы покупать, включите режим покупателя в{" "}
        <Link href="/profile/company" className="text-brand font-bold">
          профиле предприятия
        </Link>
        .
      </p>
    );
  } else {
    body = <DealOfferForm productId={product.id} />;
  }
  return (
    <Card className="mt-2 flex flex-col gap-4">
      <h2 className="text-2xl font-extrabold">Сделка</h2>
      {body}
    </Card>
  );
}

export default function Page({ params }: PageProps<"/products/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <Suspense>
        <Product params={params} />
      </Suspense>
      <Link href={routes.search} className="text-brand self-start font-bold hover:opacity-80">
        ← Ко всем предложениям
      </Link>
    </main>
  );
}
