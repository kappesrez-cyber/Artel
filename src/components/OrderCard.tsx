import Link from "next/link";
import type { OrderCardView } from "@/server/orders/orders";
import { formatDate, formatPrice } from "@/server/catalog/format";
import { ArrowLeftCircleIcon } from "./icons";
import { plural } from "./labels";
import { orderHref } from "./navigation";
import { StarCount } from "./ui";

/** Карточка заказа на рынке. Та же сетка, что у карточки позиции (макет «Поиск. Покупатель»), плюс звёзды. */
export function OrderCard({ order }: { order: OrderCardView }) {
  const city = order.city ?? order.customer.city;
  return (
    <Link
      href={orderHref(order.id)}
      className={`group hover:border-brand focus-visible:border-brand flex min-h-[calc(var(--u)*318)] flex-col rounded-[calc(var(--u)*31)] border-[calc(var(--u)*8)] bg-white pt-[calc(var(--u)*4)] pr-[calc(var(--u)*13)] pb-[calc(var(--u)*10)] pl-[calc(var(--u)*13)] leading-none font-bold tracking-[-0.04em] transition-colors outline-none max-md:border-4 max-md:p-3 ${order.stars > 0 ? "border-brand/30" : "border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-2 pt-[calc(var(--u)*8)]">
        <h2 className="line-clamp-2 pl-[calc(var(--u)*10)] text-[calc(var(--u)*40)] leading-[1.15] text-gray-900 max-md:text-2xl">
          {order.title}
        </h2>
        <StarCount stars={order.stars} className="text-[calc(var(--u)*30)] max-md:text-base" />
      </div>
      <p className="mt-[calc(var(--u)*14)] text-[calc(var(--u)*30)] text-gray-600 max-md:mt-2 max-md:text-xl">
        <span className="block truncate">{order.customer.name}</span>
        {city && <span className="block truncate">г. {city}</span>}
      </p>
      <p className="mt-[calc(var(--u)*8)] pl-[calc(var(--u)*3)] text-[calc(var(--u)*30)] text-gray-600 max-md:text-xl">
        Срок: {order.deadline ? formatDate(order.deadline) : "по договорённости"}
        {order.totalQuantity != null && ` · ${order.totalQuantity} ${order.unit}`}
      </p>
      {order.supporters > 0 && (
        <p className="text-brand mt-[calc(var(--u)*8)] pl-[calc(var(--u)*3)] text-[calc(var(--u)*26)] max-md:text-base">
          +{plural(order.supporters, "предприятие", "предприятия", "предприятий")} с тем же запросом
        </p>
      )}
      <div className="mt-auto flex items-end justify-between gap-2 pt-[calc(var(--u)*10)]">
        {order.budget ? (
          <p className="text-brand-dark text-[calc(var(--u)*44)] tracking-[0.04em] whitespace-nowrap max-md:text-2xl">
            {formatPrice(order.budget)}
          </p>
        ) : (
          <p className="text-[calc(var(--u)*30)] text-gray-500 max-md:text-lg">Бюджет по запросу</p>
        )}
        <ArrowLeftCircleIcon className="text-brand-dark size-[calc(var(--u)*65)] shrink-0 transition-transform group-hover:-translate-x-1 max-md:size-8" />
      </div>
    </Link>
  );
}
