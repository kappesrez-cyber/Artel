import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { CheckIcon, SparkleIcon } from "@/components/icons";
import { routes } from "@/components/navigation";
import { ProductCard } from "@/components/ProductCard";
import { PageFallback } from "@/components/ui";
import { searchProducts } from "@/server/catalog/products";
import { angleLabel } from "@/server/photo-search/angles";
import { getPhotoSearch } from "@/server/photo-search/photo-search";

export const metadata: Metadata = { title: "Результат поиска по фото" };

const imageSrc = (id: string) => `/api/photo-search/images/${encodeURIComponent(id)}`;

async function Result({ params }: Pick<PageProps<"/search/photo/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const search = await getPhotoSearch(id);
  if (!search) notFound();
  const r = search.recognition;
  const { items } = search.query ? await searchProducts(search.query, 9) : { items: [] };
  const now = new Date();
  const recognized = r.status === "recognized";
  const matched = r.photos.filter((p) => p.matched).length;
  const percent = Math.round(r.confidence * 100);
  const orderHref = `${routes.newOrder}?q=${encodeURIComponent(r.original ?? search.hint ?? "")}`;

  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <ul className="grid grid-cols-2 gap-3 md:gap-4">
          {search.images.map((image, i) => {
            const info = r.photos[i];
            return (
              <li
                key={image.id}
                className="relative overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- снимок отдаёт наш API */}
                <img
                  src={imageSrc(image.id)}
                  alt={`Фото ${i + 1}: ${angleLabel(image.angle)}`}
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="text-brand-dark absolute top-2 left-2 rounded-full bg-white/95 px-3 py-1 text-sm font-bold shadow">
                  {angleLabel(image.angle)}
                </span>
                {info && (
                  <p
                    className={`absolute inset-x-2 bottom-2 flex items-start gap-2 rounded-2xl px-3 py-2 text-sm leading-snug font-bold shadow backdrop-blur ${info.matched ? "bg-brand-dark/90 text-white" : "bg-white/90 text-gray-600"}`}
                  >
                    {info.matched ? (
                      <CheckIcon className="mt-0.5 size-4 shrink-0" />
                    ) : (
                      <span className="shrink-0">—</span>
                    )}
                    {info.note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <section className="flex flex-col gap-5 rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-[var(--shadow-soft)] md:p-8">
          <span className="text-brand inline-flex items-center gap-2 text-sm font-extrabold tracking-wide uppercase">
            <SparkleIcon className="size-4" />
            {recognized ? "ИИ распознал деталь" : "ИИ не уверен"}
          </span>
          <h1 className="text-3xl leading-tight font-extrabold text-gray-900 md:text-4xl">
            {r.title}
          </h1>
          {r.original && (
            <p className="text-xl text-gray-600">
              Импортный оригинал: <span className="font-extrabold text-gray-900">{r.original}</span>
            </p>
          )}
          {recognized && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-gray-600">Уверенность</span>
                <span className="text-brand-dark text-4xl font-extrabold">{percent}%</span>
              </div>
              <div className="bg-brand/10 h-3 overflow-hidden rounded-full">
                <div
                  className="from-brand to-brand-dark h-full rounded-full bg-linear-to-r"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                Совпало ракурсов: {matched} из {r.photos.length}
              </span>
            </div>
          )}
          {r.attributes.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t border-gray-100 pt-5">
              {r.attributes.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-bold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {search.hint && (
            <p className="text-gray-600">
              Ваша подпись: <span className="font-bold">«{search.hint}»</span>
            </p>
          )}
          {r.tips.length > 0 && (
            <ul className="flex flex-col gap-1.5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
              {r.tips.map((tip) => (
                <li key={tip}>💡 {tip}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
              {items.length > 0 ? "Отечественные замены" : "Замен в каталоге пока нет"}
            </h2>
            {items.length > 0 && (
              <p className="mt-1 text-gray-600">
                Плашка на карточке — итог ИИ-проверки производителя: смотрите не только на цену.
              </p>
            )}
          </div>
          <Link href={orderHref} className="text-brand font-bold hover:opacity-80">
            Разместить заказ на эту деталь →
          </Link>
        </div>
        {items.length > 0 && (
          <ul className="grid grid-cols-1 gap-x-[calc(var(--u)*75)] gap-y-[calc(var(--u)*50)] max-md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Page({ params }: PageProps<"/search/photo/[id]">) {
  return (
    <main className="flex flex-1 flex-col gap-6 px-[calc(var(--u)*42)] pt-[calc(var(--u)*50)] pb-[calc(var(--u)*60)] max-md:px-3 max-md:pt-6">
      <Link
        href={routes.searchByPhoto}
        className="text-brand self-start font-bold hover:opacity-80"
      >
        ← Новый поиск по фото
      </Link>
      <Suspense fallback={<PageFallback />}>
        <Result params={params} />
      </Suspense>
    </main>
  );
}
