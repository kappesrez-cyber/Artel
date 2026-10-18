import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonClass, secondaryButtonClass } from "@/components/form";
import { plural } from "@/components/labels";
import { routes } from "@/components/navigation";
import { Card, PageFallback } from "@/components/ui";
import { cancelPurchase, payWithStub } from "@/app/profile/stars/actions";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatPrice } from "@/server/catalog/format";
import { safeNext } from "@/server/forms";
import { getOwnStarPurchase } from "@/server/stars/stars";

export const metadata: Metadata = { title: "Оплата звёзд" };

/**
 * Страница оплаты платёжной заглушки. Настоящий провайдер вместо неё покажет свою страницу
 * (см. `src/server/stars/payments.ts`).
 */
async function Checkout({ params, searchParams }: PageProps<"/stars/checkout/[id]">) {
  const { id } = await params;
  const { next } = await searchParams;
  const user = await requireOrganizationUser(routes.stars);
  const purchase = await getOwnStarPurchase(user.organization.id, id);
  if (!purchase || purchase.provider !== "stub") notFound();
  const returnTo = safeNext(Array.isArray(next) ? next[0] : next, routes.stars);

  return (
    <Card className="flex flex-col gap-5">
      <p className="bg-brand-gray/50 rounded-2xl px-4 py-3 text-gray-800">
        Тестовая оплата: деньги не списываются. Когда подключим платёжную систему, здесь будет её
        страница.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-xl">
        <dt className="text-gray-600">Получатель</dt>
        <dd className="font-bold">{user.organization.name}</dd>
        <dt className="text-gray-600">Звёзды</dt>
        <dd className="font-bold">{plural(purchase.stars, "звезда", "звезды", "звёзд")}</dd>
        <dt className="text-gray-600">К оплате</dt>
        <dd className="font-bold">{formatPrice(purchase.amount)}</dd>
      </dl>
      {purchase.status === "PENDING" ? (
        <div className="flex flex-wrap gap-3">
          <form action={payWithStub.bind(null, purchase.id, returnTo)}>
            <button type="submit" className={buttonClass}>
              Оплатить {formatPrice(purchase.amount)}
            </button>
          </form>
          <form action={cancelPurchase.bind(null, purchase.id, returnTo)}>
            <button type="submit" className={secondaryButtonClass}>
              Отменить
            </button>
          </form>
        </div>
      ) : (
        <p className="text-lg">
          {purchase.status === "PAID" ? "Этот платёж уже оплачен." : "Этот платёж отменён."}
        </p>
      )}
    </Card>
  );
}

export default function Page(props: PageProps<"/stars/checkout/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 md:py-12">
      <h1 className="mb-6 text-4xl font-extrabold tracking-[-0.01em]">Оплата звёзд</h1>
      <Suspense fallback={<PageFallback />}>
        <Checkout {...props} />
      </Suspense>
    </main>
  );
}
