import type { Metadata } from "next";
import { Suspense } from "react";
import { routes } from "@/components/navigation";
import { PageFallback } from "@/components/ui";
import { requireOrganizationUser } from "@/server/auth/access";
import { getStarBalance } from "@/server/stars/stars";
import { OrderForm } from "./OrderForm";

export const metadata: Metadata = { title: "Размещение карточки на заказ" };

async function NewOrder({ searchParams }: Pick<PageProps<"/orders/new">, "searchParams">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const user = await requireOrganizationUser(
    query ? `${routes.newOrder}?q=${encodeURIComponent(query)}` : routes.newOrder,
  );
  const balance = await getStarBalance(user.organization.id);
  return (
    <OrderForm
      balance={balance}
      buyStarsHref={`${routes.stars}?next=${encodeURIComponent(routes.newOrder)}`}
      defaults={{ title: query.slice(0, 200), contactName: user.name, contactEmail: user.email }}
    />
  );
}

/** Заказчик не нашёл позицию в каталоге и выставляет заказ на рынок, как тендер. */
export default function Page({ searchParams }: PageProps<"/orders/new">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-[calc(var(--u)*75)] leading-[1.2] font-extrabold tracking-[-0.01em] text-gray-900 max-md:text-3xl">
        Размещение карточки на заказ
      </h1>
      <p className="mt-2 mb-8 text-lg text-gray-600">
        Опишите, что нужно, приложите ТЗ и документы. Заказ увидят все предприятия в режиме
        «Продавцам».
      </p>
      <Suspense fallback={<PageFallback />}>
        <NewOrder searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
