import type { Metadata } from "next";
import Link from "next/link";
import { GuestLogin } from "@/components/GuestLogin";
import { notFound } from "next/navigation";
import { after, connection } from "next/server";
import { Suspense } from "react";
import { VerdictLine } from "@/components/Assessment";
import { CompanyLogo } from "@/components/CompanyLogo";
import { DeliveryEstimate } from "@/components/DeliveryEstimate";
import { companyHref, routes } from "@/components/navigation";
import { PhotoGallery } from "@/components/PhotoGallery";
import { partKind, partKindLabels, ProductIllustration } from "@/components/ProductIllustration";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate, formatPrice, readyDate } from "@/server/catalog/format";
import { getPublishedProduct, type ProductView } from "@/server/catalog/products";
import { recordProductView } from "@/server/analytics/events";
import { DealOfferForm } from "./DealOfferForm";

export const metadata: Metadata = { title: "Позиция каталога" };

/** «30×62×16 мм» из описания — габариты для характеристик. */
function dimensions(text: string | null): string | null {
  const match = text?.match(/(\d+(?:[.,]\d+)?(?:\s*[×xх]\s*\d+(?:[.,]\d+)?){1,2})\s*мм/i);
  return match ? `${match[1].replace(/\s*[xх]\s*/gi, "×")} мм` : null;
}

const sectionTitle = "text-lg font-extrabold text-gray-900";

async function Product({ params }: Pick<PageProps<"/products/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const product = await getPublishedProduct(id);
  if (!product) notFound();
  // Просмотр записываем после ответа, чтобы не задерживать страницу.
  const viewer = await getCurrentUser();
  after(() => recordProductView(product, viewer?.organization?.id ?? null));

  const kind = partKind(product.name, product.description);
  const size = dimensions(product.description);
  const ready = readyDate(product.leadTimeDays);
  const specs: [string, string][] = [
    ["Категория", partKindLabels[kind]],
    ...(product.article ? [["Артикул", product.article] as [string, string]] : []),
    ...(product.analogs ? [["Заменяет", product.analogs] as [string, string]] : []),
    ...(size ? [["Габариты", size] as [string, string]] : []),
    ["Срок производства", `${product.leadTimeDays} дн.`],
    ["Город отгрузки", product.city],
  ];

  const isOwner = viewer?.organization?.id === product.organization.id;
  const assessment = product.organization.assessment;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={routes.search}
        className="text-brand-dark self-start text-sm font-bold hover:underline"
      >
        ← Ко всем предложениям
      </Link>
      <article className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_340px]">
        <div className="self-start md:sticky md:top-6 md:row-span-3 lg:row-span-2">
          {product.photos.length > 0 || isOwner ? (
            <PhotoGallery
              photos={product.photos}
              alt={product.name}
              owner={isOwner ? { productId: product.id } : undefined}
            />
          ) : (
            <ProductIllustration
              name={product.name}
              description={product.description}
              className="aspect-[4/3] w-full rounded-2xl"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2 md:col-start-2 lg:row-start-1">
          <p className="text-sm text-gray-500">
            {partKindLabels[kind]}
            {product.article && ` · арт. ${product.article}`}
          </p>
          <h1 className="text-3xl leading-tight font-extrabold break-words hyphens-auto text-gray-900">
            {product.name}
          </h1>
          {product.description && <p className="text-base text-gray-600">{product.description}</p>}
        </div>

        <aside className="border-brand-dark flex flex-col gap-4 self-start rounded-2xl border-2 bg-white p-5 md:col-start-2 lg:sticky lg:top-6 lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <div className="flex flex-col gap-1">
            <p className="text-brand-dark text-3xl leading-none font-extrabold">
              {formatPrice(product.price)}
              <span className="text-base font-bold text-gray-500"> / шт.</span>
            </p>
            <p className="text-sm text-gray-500">
              Будет готово {formatDate(ready)} · {product.leadTimeDays} дн. производства
            </p>
          </div>
          <hr className="border-gray-200" />
          <DeliveryEstimate origin={product.city} readyAt={ready.toISOString()} />
          <hr className="border-gray-200" />
          <Suspense>
            <DealOffer product={product} />
          </Suspense>
        </aside>
        <div className="flex min-w-0 flex-col gap-6 md:col-start-2 lg:row-start-2">
          <section className="flex flex-col gap-3">
            <h2 className={sectionTitle}>Характеристики</h2>
            <dl className="flex flex-col gap-2 text-base">
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <dt className="shrink-0 text-gray-500">{label}</dt>
                  <span
                    aria-hidden
                    className="min-w-4 flex-1 border-b border-dotted border-gray-300"
                  />
                  <dd className="max-w-[60%] text-right font-bold break-words text-gray-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className={sectionTitle}>Производитель</h2>
            <Link
              href={companyHref(product.organization.id)}
              className="hover:border-brand-dark flex items-center gap-3 rounded-2xl border border-gray-200 p-4 transition-colors"
            >
              <CompanyLogo organization={product.organization} className="size-12 text-sm" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-base font-bold text-gray-900">
                  {product.organization.name}
                </span>
                {assessment ? (
                  <VerdictLine
                    verdict={assessment.verdict}
                    tone={assessment.tone}
                    className="text-sm"
                  />
                ) : (
                  <span className="text-sm text-gray-500">г. {product.city}</span>
                )}
              </span>
              <span aria-hidden className="text-brand-dark ml-auto text-base font-bold">
                →
              </span>
            </Link>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className={sectionTitle}>Как проходит сделка</h2>
            <ol className="flex flex-col gap-2 text-base text-gray-600">
              {[
                "Вы предлагаете сделку: количество и пожелания к сроку.",
                "Производитель подтверждает цену и срок или предлагает свои.",
                "Деталь изготавливают и отгружают, после получения вы оставляете отзыв.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="bg-brand-mist text-brand-dark grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </article>
    </div>
  );
}

/** Блок сделки: форма для покупателя, подсказка для всех остальных. */
async function DealOffer({ product }: { product: ProductView }) {
  const user = await getCurrentUser();
  if (!user?.organization) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={`${routes.login}?next=${encodeURIComponent(`/products/${product.id}`)}`}
          className="bg-brand-dark hover:bg-brand-navy rounded-full py-3 text-center text-base font-bold text-white transition-colors"
        >
          Войти и предложить сделку
        </Link>
        <GuestLogin next={`/products/${product.id}`} />
        <p className="text-sm text-gray-500">Сделки заключаются от имени предприятия.</p>
      </div>
    );
  }
  if (user.organization.id === product.organization.id) {
    return (
      <p className="text-base">
        Это ваша позиция.{" "}
        <Link href={`/profile/products/${product.id}`} className="text-brand-dark font-bold">
          Изменить
        </Link>
      </p>
    );
  }
  if (!user.organization.isBuyer) {
    return (
      <p className="text-base">
        Чтобы покупать, включите режим покупателя в{" "}
        <Link href="/profile/company" className="text-brand-dark font-bold">
          профиле предприятия
        </Link>
        .
      </p>
    );
  }
  return <DealOfferForm productId={product.id} />;
}

export default function Page({ params }: PageProps<"/products/[id]">) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 pt-6 max-md:px-4">
      <Suspense>
        <Product params={params} />
      </Suspense>
    </main>
  );
}
