import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/form";
import { routes } from "@/components/navigation";
import { OrderCard } from "@/components/OrderCard";
import { Badge, Empty, PageFallback, Section } from "@/components/ui";
import { requireOrganizationUser } from "@/server/auth/access";
import { listOrganizationOrders, type OrderCardView } from "@/server/orders/orders";

export const metadata: Metadata = { title: "Мои заказы" };

function OrderGrid({ orders }: { orders: OrderCardView[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {orders.map((order) => (
        <li key={order.id} className="flex flex-col gap-2">
          {order.status !== "OPEN" && (
            <div>
              <Badge>Снят с рынка</Badge>
            </div>
          )}
          <OrderCard order={order} />
        </li>
      ))}
    </ul>
  );
}

async function Orders() {
  const user = await requireOrganizationUser(routes.myOrders);
  const { own, supported } = await listOrganizationOrders(user.organization.id);
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Мои заказы"
        action={
          <Link href={routes.newOrder} className={buttonClass}>
            Разместить заказ
          </Link>
        }
      >
        {own.length ? (
          <OrderGrid orders={own} />
        ) : (
          <Empty>
            Не нашли нужную позицию в каталоге? Разместите заказ: его увидят все производители.
          </Empty>
        )}
      </Section>
      {supported.length > 0 && (
        <Section title="Поддержанные звёздами">
          <OrderGrid orders={supported} />
        </Section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Orders />
    </Suspense>
  );
}
