import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass, secondaryButtonClass } from "@/components/form";
import { productStatusLabels } from "@/components/labels";
import { productHref } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatPrice } from "@/server/catalog/format";
import { listOrganizationProducts } from "@/server/catalog/products";
import { setProductStatus } from "../actions";
import { Badge, Card, Empty, PageFallback, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Мой каталог" };

const statusTone = { DRAFT: "outline", PUBLISHED: "solid", ARCHIVED: "gray" } as const;

async function Products() {
  const { organization } = await requireOrganizationUser("/profile/products");
  if (!organization.isSeller) {
    return (
      <Section title="Мой каталог">
        <Empty>
          Каталог доступен в режиме продавца. Включите его в разделе{" "}
          <Link href="/profile/company" className="text-brand font-bold">
            «О предприятии»
          </Link>
          .
        </Empty>
      </Section>
    );
  }
  const products = await listOrganizationProducts(organization.id);
  return (
    <Section
      title="Мой каталог"
      action={
        <Link href="/profile/products/new" className={buttonClass}>
          + Новая позиция
        </Link>
      }
    >
      {products.length === 0 ? (
        <Empty>Добавьте первую позицию: покупатели найдут её через поиск.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-bold">{p.name}</span>
                  <span className="text-gray-600">
                    {formatPrice(p.price)} · {p.leadTimeDays} дн. · г. {p.city}
                  </span>
                  <div className="pt-1">
                    <Badge tone={statusTone[p.status]}>{productStatusLabels[p.status]}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "PUBLISHED" && (
                    <Link href={productHref(p.id)} className={secondaryButtonClass}>
                      Открыть
                    </Link>
                  )}
                  <Link href={`/profile/products/${p.id}`} className={secondaryButtonClass}>
                    Изменить
                  </Link>
                  {p.status !== "PUBLISHED" ? (
                    <form action={setProductStatus.bind(null, p.id, "PUBLISHED")}>
                      <button type="submit" className={secondaryButtonClass}>
                        Опубликовать
                      </button>
                    </form>
                  ) : (
                    <form action={setProductStatus.bind(null, p.id, "ARCHIVED")}>
                      <button type="submit" className={secondaryButtonClass}>
                        Снять с продажи
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Products />
    </Suspense>
  );
}
