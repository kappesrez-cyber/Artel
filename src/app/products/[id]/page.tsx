import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { routes } from "@/components/navigation";
import { formatDate, formatPrice, readyDate } from "@/server/catalog/format";
import { getPublishedProduct } from "@/server/catalog/products";

export const metadata: Metadata = { title: "Позиция каталога" };

async function Product({ params }: Pick<PageProps<"/products/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const product = await getPublishedProduct(id);
  if (!product) notFound();

  const facts = [
    ["Производитель", product.organization.name],
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
    </article>
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
