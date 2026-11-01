import Link from "next/link";
import type { ProductView } from "@/server/catalog/products";
import { formatDate, formatPrice, readyDate } from "@/server/catalog/format";
import { VerdictLine } from "./Assessment";
import { productHref } from "./navigation";
import { ProductIllustration } from "./ProductIllustration";

/**
 * Карточка результата поиска, как на маркетплейсах: картинка, цена, название, срок и город,
 * одной строкой итог проверки производителя и кнопка. Название производителя и его плашки —
 * на странице позиции: на этапе выбора детали они только мешают.
 * Срок показывается датой: сегодня плюс срок производства, поэтому `now` — момент просмотра страницы.
 */
export function ProductCard({ product, now }: { product: ProductView; now: Date }) {
  const photo = product.photos[0];
  const assessment = product.organization.assessment;
  return (
    <Link
      href={productHref(product.id)}
      className="group hover:border-brand-dark focus-visible:border-brand-dark focus-visible:ring-brand-dark/20 flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors outline-none focus-visible:ring-4 max-sm:rounded-xl"
    >
      <div className="aspect-[4/3] shrink-0 overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- снимок из своей базы, оптимизатор не нужен
          <img
            src={`/api/photos/${encodeURIComponent(photo.id)}`}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ProductIllustration
            name={product.name}
            description={product.description}
            className="size-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 max-sm:gap-1.5 max-sm:p-3">
        <p className="text-brand-dark text-2xl leading-none font-extrabold whitespace-nowrap max-sm:text-xl">
          {formatPrice(product.price)}
        </p>
        <h2 className="line-clamp-2 min-h-[2lh] text-base leading-snug font-bold text-gray-900 max-sm:text-sm">
          {product.name}
        </h2>
        <p className="text-sm text-gray-500 max-sm:text-xs">
          Готово к {formatDate(readyDate(product.leadTimeDays, now))} · {product.city}
        </p>
        {assessment && (
          <VerdictLine
            verdict={assessment.verdict}
            tone={assessment.tone}
            className="text-sm max-sm:text-xs"
          />
        )}
        <span aria-hidden className="flex-1" />
        <span className="bg-brand-dark group-hover:bg-brand-navy mt-2 flex items-center justify-center rounded-xl py-2.5 text-base font-bold text-white transition-colors max-sm:py-2 max-sm:text-sm">
          Подробнее
        </span>
      </div>
    </Link>
  );
}
