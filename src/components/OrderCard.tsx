import Link from "next/link";
import type { ReactNode } from "react";
import type { OrderCardView } from "@/server/orders/orders";
import { formatDate, formatPrice } from "@/server/catalog/format";
import { CompanyLogo } from "./CompanyLogo";
import { ArrowLeftCircleIcon } from "./icons";
import { plural } from "./labels";
import { orderHref } from "./navigation";
import { StarCount } from "./ui";

/**
 * Карточка заказа на рынке. Тот же стиль, что у карточки позиции в поиске: заказчик сверху,
 * название, срок и объём плитками, внизу бюджет и кнопка. Звёзды — плашкой справа вверху.
 */
export function OrderCard({ order }: { order: OrderCardView }) {
  const city = order.city ?? order.customer.city;
  return (
    <Link
      href={orderHref(order.id)}
      className={`group hover:border-brand-dark focus-visible:border-brand-dark focus-visible:ring-brand-dark/20 flex h-full flex-col rounded-[calc(var(--u)*24)] border-[calc(var(--u)*2)] bg-white p-[calc(var(--u)*26)] shadow-(--shadow-soft) transition-[border-color,box-shadow,translate] outline-none hover:-translate-y-0.5 hover:shadow-(--shadow-lift) focus-visible:ring-4 max-md:rounded-2xl max-md:border max-md:p-4 ${order.stars > 0 ? "border-brand-dark/25" : "border-gray-200"}`}
    >
      <div className="flex items-center gap-[calc(var(--u)*14)] max-md:gap-2.5">
        <CompanyLogo
          organization={order.customer}
          className="size-[calc(var(--u)*60)] text-[calc(var(--u)*22)] max-md:size-10 max-md:text-sm"
        />
        <p className="min-w-0 flex-1 leading-[1.25]">
          <span className="block truncate text-[calc(var(--u)*24)] font-bold text-gray-900 max-md:text-base">
            {order.customer.name}
          </span>
          {city && (
            <span className="block truncate text-[calc(var(--u)*21)] text-gray-500 max-md:text-sm">
              г. {city}
            </span>
          )}
        </p>
        <StarCount stars={order.stars} className="text-[calc(var(--u)*24)] max-md:text-sm" />
      </div>

      <h2 className="mt-[calc(var(--u)*22)] line-clamp-2 text-[calc(var(--u)*32)] leading-[1.2] font-extrabold tracking-[-0.01em] text-gray-900 max-md:mt-3 max-md:text-xl">
        {order.title}
      </h2>

      <dl className="mt-[calc(var(--u)*20)] grid grid-cols-2 gap-[calc(var(--u)*12)] max-md:mt-3 max-md:gap-2">
        <Fact label="Срок">{order.deadline ? formatDate(order.deadline) : "Договорной"}</Fact>
        <Fact label="Объём">
          {order.totalQuantity != null ? `${order.totalQuantity} ${order.unit}` : "Не указан"}
        </Fact>
      </dl>

      {order.supporters > 0 && (
        <p className="text-brand-dark mt-[calc(var(--u)*14)] text-[calc(var(--u)*21)] font-semibold max-md:mt-2 max-md:text-sm">
          +{plural(order.supporters, "предприятие", "предприятия", "предприятий")} с тем же запросом
        </p>
      )}

      <div className="mt-auto pt-[calc(var(--u)*24)] max-md:pt-4">
        <div className="flex items-baseline justify-between gap-3 border-t border-gray-200 pt-[calc(var(--u)*20)] max-md:pt-3">
          <span className="text-[calc(var(--u)*19)] font-semibold text-gray-500 max-md:text-xs">
            Бюджет
          </span>
          {order.budget ? (
            <p className="text-brand-navy text-[calc(var(--u)*38)] leading-none font-extrabold tracking-[-0.01em] whitespace-nowrap max-md:text-2xl">
              {formatPrice(order.budget)}
            </p>
          ) : (
            <p className="text-[calc(var(--u)*26)] leading-none font-bold text-gray-500 max-md:text-lg">
              По запросу
            </p>
          )}
        </div>
        <span className="bg-brand-dark group-hover:bg-brand-navy mt-[calc(var(--u)*20)] flex items-center justify-center gap-[calc(var(--u)*10)] rounded-[calc(var(--u)*14)] py-[calc(var(--u)*16)] text-[calc(var(--u)*24)] font-bold text-white transition-colors max-md:mt-3 max-md:gap-2 max-md:rounded-xl max-md:py-2.5 max-md:text-base">
          Открыть заказ
          <ArrowLeftCircleIcon className="size-[calc(var(--u)*28)] rotate-180 transition-transform group-hover:translate-x-1 max-md:size-5" />
        </span>
      </div>
    </Link>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-brand-mist min-w-0 rounded-[calc(var(--u)*14)] px-[calc(var(--u)*16)] py-[calc(var(--u)*12)] leading-[1.2] max-md:rounded-lg max-md:px-3 max-md:py-2">
      <dt className="text-[calc(var(--u)*19)] font-semibold text-gray-500 max-md:text-xs">
        {label}
      </dt>
      <dd className="text-brand-dark mt-[calc(var(--u)*4)] truncate text-[calc(var(--u)*24)] font-bold max-md:text-base">
        {children}
      </dd>
    </div>
  );
}
