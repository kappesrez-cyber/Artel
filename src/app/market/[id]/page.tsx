import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { buttonClass, secondaryButtonClass } from "@/components/form";
import { plural } from "@/components/labels";
import { companyHref, orderHref, routes } from "@/components/navigation";
import { Badge, Card, PageFallback, StarCount } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate, formatMoment, formatPrice } from "@/server/catalog/format";
import { getOrder, type OrderDetailView } from "@/server/orders/orders";
import { getStarBalance } from "@/server/stars/stars";
import { setOpen } from "./actions";
import { BoostForm } from "./BoostForm";

export const metadata: Metadata = { title: "Заказ" };

const sectionTitle = "text-[calc(var(--u)*56)] font-extrabold tracking-[-0.01em] max-md:text-2xl";

async function Order({ params }: Pick<PageProps<"/market/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const user = await getCurrentUser();
  const viewer = user?.organization ?? null;
  const order = await getOrder(id, viewer?.id);
  if (!order) notFound();
  const isCustomer = viewer?.id === order.customer.id;
  const loginHref = `${routes.login}?next=${encodeURIComponent(orderHref(order.id))}`;

  const facts: [string, ReactNode][] = [
    [
      "Заказчик",
      <Link
        key="customer"
        href={companyHref(order.customer.id)}
        className="text-brand hover:opacity-80"
      >
        {order.customer.name}
      </Link>,
    ],
  ];
  const city = order.city ?? order.customer.city;
  if (city) facts.push(["Город поставки", city]);
  if (order.quantity != null) facts.push(["Количество", `${order.quantity} ${order.unit}`]);
  if (order.supporters > 0 && order.totalQuantity != null) {
    facts.push(["Общий спрос", `${order.totalQuantity} ${order.unit}`]);
  }
  facts.push(["Бюджет", order.budget ? formatPrice(order.budget) : "по запросу"]);
  facts.push(["Срок", order.deadline ? formatDate(order.deadline) : "по договорённости"]);
  facts.push(["Размещён", formatMoment(order.createdAt)]);

  const specFiles = order.attachments.filter((f) => f.kind === "SPECIFICATION");
  const techFiles = order.attachments.filter((f) => f.kind === "TECHNICAL");

  return (
    <article className="grid items-start gap-8 lg:grid-cols-[1fr_420px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[calc(var(--u)*75)] leading-[1.1] font-extrabold tracking-[-0.01em] text-gray-900 max-md:text-3xl">
            {order.title}
          </h1>
          <StarCount stars={order.stars} className="text-xl" />
          {order.status !== "OPEN" && <Badge tone="gray">Снят с рынка</Badge>}
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-xl">
          {facts.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-gray-600">{label}</dt>
              <dd className="font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        <Collapsible title="Информация">
          <p className="text-lg whitespace-pre-line text-gray-800">{order.description}</p>
        </Collapsible>

        <Collapsible title="Основное ТЗ">
          {order.specification ? (
            <p className="text-lg whitespace-pre-line text-gray-800">{order.specification}</p>
          ) : (
            !specFiles.length && <p className="text-gray-500">Заказчик не приложил ТЗ.</p>
          )}
          <Files order={order} files={specFiles} canDownload={Boolean(viewer)} />
        </Collapsible>

        <Collapsible title="Техн. документация">
          {techFiles.length ? (
            <Files order={order} files={techFiles} canDownload={Boolean(viewer)} />
          ) : (
            <p className="text-gray-500">Чертежей и схем нет.</p>
          )}
        </Collapsible>
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
        <Card className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold">Контакты заказчика</h2>
          {viewer ? (
            <ul className="flex flex-col gap-1 text-lg">
              <li className="font-bold">{order.contactName}</li>
              {order.contactPhone && (
                <li>
                  <a href={`tel:${order.contactPhone}`} className="text-brand hover:opacity-80">
                    {order.contactPhone}
                  </a>
                </li>
              )}
              {order.contactEmail && (
                <li>
                  <a href={`mailto:${order.contactEmail}`} className="text-brand hover:opacity-80">
                    {order.contactEmail}
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <>
              <p className="text-gray-600">
                Контакты и файлы видны предприятиям, которые вошли на платформу.
              </p>
              <div>
                <Link href={loginHref} className={buttonClass}>
                  Войти
                </Link>
              </div>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-4 border-amber-200">
          <div>
            <h2 className="text-2xl font-extrabold">Продвинуть за звёзды</h2>
            <p className="mt-1 text-gray-600">
              {isCustomer
                ? "Чем больше звёзд, тем выше заказ на рынке и тем быстрее его увидят производители."
                : "Вам нужна такая же позиция? Вложите звёзды: заказ поднимется выше, а производитель увидит общий объём и сможет сделать поставку сразу для нескольких предприятий."}
            </p>
          </div>
          {order.status !== "OPEN" ? (
            <p className="text-gray-500">Заказ снят с рынка, продвигать его нельзя.</p>
          ) : viewer ? (
            <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-gray-100" />}>
              <Boost order={order} organizationId={viewer.id} isCustomer={isCustomer} />
            </Suspense>
          ) : (
            <div>
              <Link href={loginHref} className={buttonClass}>
                Войти, чтобы продвинуть
              </Link>
            </div>
          )}
        </Card>

        {order.boosts.length > 0 && <Supporters order={order} />}

        {isCustomer && (
          <form action={setOpen.bind(null, order.id, order.status !== "OPEN")}>
            <button type="submit" className={secondaryButtonClass}>
              {order.status === "OPEN" ? "Снять с рынка: исполнитель найден" : "Вернуть на рынок"}
            </button>
          </form>
        )}
      </aside>
    </article>
  );
}

async function Boost({
  order,
  organizationId,
  isCustomer,
}: {
  order: OrderDetailView;
  organizationId: string;
  isCustomer: boolean;
}) {
  const balance = await getStarBalance(organizationId);
  const buyHref = `${routes.stars}?next=${encodeURIComponent(orderHref(order.id))}`;
  return (
    <div className="flex flex-col gap-4">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
        На счету: <b>{plural(balance, "звезда", "звезды", "звёзд")}</b>
        <Link href={buyHref} className="text-brand font-bold hover:opacity-80">
          Купить звёзды →
        </Link>
      </p>
      {balance > 0 ? (
        <BoostForm orderId={order.id} isCustomer={isCustomer} unit={order.unit} balance={balance} />
      ) : (
        <div>
          <Link href={buyHref} className={buttonClass}>
            Купить звёзды
          </Link>
        </div>
      )}
    </div>
  );
}

function Supporters({ order }: { order: OrderDetailView }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-2xl font-extrabold">Поддержали заказ</h2>
      <ul className="flex flex-col gap-3">
        {order.boosts.map((b) => (
          <li key={b.id} className="flex flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <Link
                href={companyHref(b.organization.id)}
                className="text-brand font-bold hover:opacity-80"
              >
                {b.organization.name}
              </Link>
              <span className="font-bold text-amber-700">+{b.stars} ★</span>
              {b.organizationId === order.customer.id && <Badge>заказчик</Badge>}
            </span>
            {b.quantity != null && (
              <span className="text-gray-700">
                Тоже нужно: {b.quantity} {order.unit}
              </span>
            )}
            {b.comment && <span className="text-sm text-gray-500">{b.comment}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group flex flex-col gap-3">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <h2 className={sectionTitle}>{title}</h2>
        <span
          aria-hidden
          className="text-[calc(var(--u)*48)] leading-none transition-transform group-open:rotate-180 max-md:text-xl"
        >
          ∨
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}

function Files({
  order,
  files,
  canDownload,
}: {
  order: OrderDetailView;
  files: OrderDetailView["attachments"];
  canDownload: boolean;
}) {
  if (!files.length) return null;
  return (
    <ul className="flex flex-col gap-2">
      {files.map((f) => (
        <li key={f.id} className="flex flex-wrap items-baseline gap-2 text-lg">
          <span aria-hidden>📎</span>
          {canDownload ? (
            <a
              href={`/api/orders/${order.id}/attachments/${f.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand font-bold break-all hover:opacity-80"
            >
              {f.fileName}
            </a>
          ) : (
            <span className="font-bold break-all">{f.fileName}</span>
          )}
          <span className="text-sm text-gray-500">{formatSize(f.size)}</span>
        </li>
      ))}
    </ul>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} МБ`;
}

export default function Page({ params }: PageProps<"/market/[id]">) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-10">
      <Link
        href={routes.market}
        className="text-brand mb-6 inline-block font-bold hover:opacity-80"
      >
        ← Все заказы
      </Link>
      <Suspense fallback={<PageFallback />}>
        <Order params={params} />
      </Suspense>
    </main>
  );
}
