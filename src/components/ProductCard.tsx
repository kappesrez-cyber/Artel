import Link from "next/link";
import type { ProductView } from "@/server/catalog/products";
import { formatDate, formatPrice, readyDate } from "@/server/catalog/format";
import { VerdictBadge } from "./Assessment";
import { CompanyLogo } from "./CompanyLogo";
import { ArrowLeftCircleIcon, PhotoIcon } from "./icons";
import { productHref } from "./navigation";

/**
 * Карточка результата поиска: фото, название, производитель и итог ИИ-сводки, внизу срок и цена.
 * Срок показывается датой: сегодня плюс срок производства, поэтому `now` — момент просмотра страницы.
 */
export function ProductCard({ product, now }: { product: ProductView; now: Date }) {
  const photo = product.photos[0];
  return (
    <Link
      href={productHref(product.id)}
      className="group hover:border-brand-dark focus-visible:border-brand-dark focus-visible:ring-brand-dark/20 flex h-full flex-col overflow-hidden rounded-[calc(var(--u)*24)] border-[calc(var(--u)*2)] border-gray-200 bg-white shadow-(--shadow-soft) transition-[border-color,box-shadow,translate] outline-none hover:-translate-y-0.5 hover:shadow-(--shadow-lift) focus-visible:ring-4 max-md:rounded-2xl max-md:border"
    >
      <div className="bg-brand-mist relative aspect-[2/1] shrink-0 border-b border-gray-200">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- снимок из своей базы, оптимизатор не нужен
          <img
            src={`/api/photos/${encodeURIComponent(photo.id)}`}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="text-brand-dark/45 flex size-full flex-col items-center justify-center gap-[calc(var(--u)*10)] text-[calc(var(--u)*22)] font-semibold max-md:gap-1 max-md:text-sm">
            <PhotoIcon className="size-[calc(var(--u)*64)] max-md:size-10" />
            Фото пока нет
          </div>
        )}
        {product.article && (
          <span className="text-brand-dark absolute top-[calc(var(--u)*16)] left-[calc(var(--u)*16)] max-w-[70%] truncate rounded-full bg-white px-[calc(var(--u)*14)] py-[calc(var(--u)*6)] text-[calc(var(--u)*20)] font-bold ring-1 ring-gray-200 max-md:top-2 max-md:left-2 max-md:px-2.5 max-md:py-1 max-md:text-xs">
            {product.article}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[calc(var(--u)*26)] max-md:p-4">
        <h2 className="line-clamp-2 text-[calc(var(--u)*32)] leading-[1.2] font-extrabold tracking-[-0.01em] text-gray-900 max-md:text-xl">
          {product.name}
        </h2>

        <div className="mt-[calc(var(--u)*20)] flex items-center gap-[calc(var(--u)*14)] max-md:mt-3 max-md:gap-2.5">
          <CompanyLogo
            organization={product.organization}
            className="size-[calc(var(--u)*60)] text-[calc(var(--u)*22)] max-md:size-10 max-md:text-sm"
          />
          <p className="min-w-0 leading-[1.25]">
            <span className="block truncate text-[calc(var(--u)*24)] font-bold text-gray-900 max-md:text-base">
              {product.organization.name}
            </span>
            <span className="block truncate text-[calc(var(--u)*21)] text-gray-500 max-md:text-sm">
              г. {product.city}
            </span>
          </p>
        </div>

        {product.organization.assessment && (
          <VerdictBadge
            verdict={product.organization.assessment.verdict}
            tone={product.organization.assessment.tone}
            className="mt-[calc(var(--u)*16)] self-start px-[calc(var(--u)*14)] py-[calc(var(--u)*6)] text-[calc(var(--u)*20)] max-md:mt-3 max-md:px-2.5 max-md:py-1 max-md:text-xs"
          />
        )}

        <div className="mt-auto pt-[calc(var(--u)*24)] max-md:pt-4">
          <div className="flex items-end justify-between gap-3 border-t border-gray-200 pt-[calc(var(--u)*20)] max-md:pt-3">
            <p className="leading-[1.2]">
              <span className="block text-[calc(var(--u)*19)] font-semibold text-gray-500 max-md:text-xs">
                Готово к
              </span>
              <span className="block text-[calc(var(--u)*24)] font-bold text-gray-900 max-md:text-base">
                {formatDate(readyDate(product.leadTimeDays, now))}
              </span>
            </p>
            <p className="text-brand-navy text-[calc(var(--u)*38)] leading-none font-extrabold tracking-[-0.01em] whitespace-nowrap max-md:text-2xl">
              {formatPrice(product.price)}
            </p>
          </div>
          <span className="bg-brand-dark group-hover:bg-brand-navy mt-[calc(var(--u)*20)] flex items-center justify-center gap-[calc(var(--u)*10)] rounded-[calc(var(--u)*14)] py-[calc(var(--u)*16)] text-[calc(var(--u)*24)] font-bold text-white transition-colors max-md:mt-3 max-md:gap-2 max-md:rounded-xl max-md:py-2.5 max-md:text-base">
            Подробнее
            <ArrowLeftCircleIcon className="size-[calc(var(--u)*28)] rotate-180 transition-transform group-hover:translate-x-1 max-md:size-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
