import Link from "next/link";
import type { ProductView } from "@/server/catalog/products";
import { formatDate, formatPrice, readyDate } from "@/server/catalog/format";
import { ArrowLeftCircleIcon } from "./icons";
import { productHref } from "./navigation";

/**
 * Карточка результата поиска. Срок показывается датой: сегодня плюс срок производства,
 * поэтому `now` — момент просмотра страницы.
 */
export function ProductCard({ product, now }: { product: ProductView; now: Date }) {
  return (
    <Link
      href={productHref(product.id)}
      className="group hover:border-brand focus-visible:border-brand flex min-h-[calc(var(--u)*318)] flex-col rounded-[calc(var(--u)*31)] border-[calc(var(--u)*8)] border-gray-200 bg-white pt-[calc(var(--u)*4)] pr-[calc(var(--u)*13)] pb-[calc(var(--u)*10)] pl-[calc(var(--u)*13)] leading-none font-bold tracking-[-0.04em] transition-colors outline-none max-md:border-4 max-md:p-3"
    >
      <h2 className="truncate pl-[calc(var(--u)*10)] text-[calc(var(--u)*48)] leading-[1.2] text-gray-900 max-md:text-2xl">
        {product.name}
      </h2>
      <p className="mt-[calc(var(--u)*17)] text-[calc(var(--u)*40)] text-gray-600 max-md:mt-2 max-md:text-xl">
        <span className="block truncate">{product.organization.name}</span>
        <span className="block truncate">г. {product.city}</span>
      </p>
      <p className="mt-[calc(var(--u)*8)] pl-[calc(var(--u)*3)] text-[calc(var(--u)*44)] text-gray-600 max-md:text-xl">
        Срок: {formatDate(readyDate(product.leadTimeDays, now))}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-[calc(var(--u)*10)]">
        <p className="text-brand-dark text-[calc(var(--u)*48)] tracking-[0.06em] whitespace-nowrap max-md:text-2xl">
          {formatPrice(product.price)}
        </p>
        <ArrowLeftCircleIcon className="text-brand-dark size-[calc(var(--u)*65)] shrink-0 transition-transform group-hover:-translate-x-1 max-md:size-8" />
      </div>
    </Link>
  );
}
