import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { GuestLogin } from "@/components/GuestLogin";
import { CheckIcon } from "@/components/icons";
import { routes } from "@/components/navigation";
import { StarAmount } from "@/components/ui";
import { buyPlan } from "@/app/profile/plan/actions";
import { getCurrentUser } from "@/server/auth/session";
import { formatDate } from "@/server/catalog/format";
import { plans, type Plan } from "@/server/plans/plans";
import { getOrganizationPlan, type OrganizationPlan } from "@/server/plans/subscriptions";

export const metadata: Metadata = { title: "Тарифы" };

const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
const boost = (p: Plan) => (p.searchBoost ? `+${Math.round(p.searchBoost * 100)}%` : "—");

/** Строки таблицы сравнения: подпись и значение для каждого тарифа. */
const rows: { label: string; hint?: string; value: (p: Plan) => ReactNode }[] = [
  { label: "Цена в месяц", value: (p) => (p.price ? rub(p.price) : "Бесплатно") },
  {
    label: "Комиссия с успешной сделки",
    hint: "Процент от суммы сделки, который берёт платформа",
    value: (p) => p.commissionLabel,
  },
  { label: "Каталог, поиск, рынок заказов", value: () => <Yes /> },
  {
    label: "Отклики на заказы",
    value: (p) => (p.price ? "Без ограничений" : "1 в месяц, до 300 000 ₽"),
  },
  {
    label: "Аналитика спроса",
    hint: "Бюджеты пулов, динамика и целевые цены",
    value: (p) => (p.price ? <Yes /> : "Тренды"),
  },
  {
    label: "Конструктор коллабораций и CAD-чертежи",
    value: (p) => (p.price ? <Yes /> : "—"),
  },
  {
    label: "Внутренний пулинг филиалов, 1С:ERP / SAP, API",
    value: (p) => (p.docsHelp ? <Yes /> : "—"),
  },
  {
    label: "Бонусные звёзды каждый месяц",
    hint: "Звёзды поднимают ваши заказы на рынке",
    value: (p) => (p.bonusStars ? <StarAmount value={p.bonusStars} /> : "—"),
  },
  {
    label: "Приоритет позиций в поиске",
    hint: "Выше среди одинаково подходящих предложений",
    value: boost,
  },
  {
    label: "Помощь юриста с документами по сделке",
    hint: "Договор, спецификация, закрывающие документы",
    value: (p) => (p.docsHelp ? <Yes /> : "—"),
  },
  { label: "Поддержка", value: (p) => p.support },
];

function Yes() {
  return (
    <>
      <CheckIcon className="text-brand mx-auto size-6" />
      <span className="sr-only">Есть</span>
    </>
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-[calc(var(--u)*90)] px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-brand-dark text-4xl leading-tight md:text-6xl">Тарифы</h1>
        <p className="max-w-2xl text-lg text-balance text-gray-600">
          Заказчикам платформа бесплатна навсегда, деньги берём с производителей: чем выше тариф,
          тем меньше комиссия со сделки и тем больше инструментов. Оплата помесячно.
        </p>
      </header>

      <Suspense fallback={<PlanCards viewer={undefined} />}>
        <PlanCardsForViewer />
      </Suspense>

      <section aria-labelledby="compare" className="flex flex-col gap-6">
        <h2 id="compare" className="text-center text-3xl font-extrabold tracking-[-0.01em]">
          Сравнение тарифов
        </h2>
        <p className="text-center text-sm text-gray-500 md:hidden">Таблицу можно листать вбок →</p>
        <div className="relative overflow-x-auto overscroll-x-contain rounded-3xl border border-gray-200/80 bg-white shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-center">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 w-[34%] bg-white p-4 text-left text-sm font-bold text-gray-500 md:p-5"
                >
                  Что входит
                </th>
                {plans.map((p) => (
                  <th
                    key={p.tier}
                    scope="col"
                    className="font-display text-brand-dark p-4 text-xl md:p-5"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100">
                  <th
                    scope="row"
                    className="sticky left-0 bg-white p-4 text-left font-bold text-gray-800 md:p-5"
                  >
                    {row.label}
                    {row.hint && (
                      <span className="block text-sm font-normal text-gray-500">{row.hint}</span>
                    )}
                  </th>
                  {plans.map((p) => (
                    <td key={p.tier} className="p-4 font-bold text-gray-700 md:p-5">
                      {row.value(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-sm text-gray-500">
          Приём платежей пока тестовый: оплата проходит без списания денег. Тариф действует 30 дней
          с оплаты, бонусные звёзды зачисляются сразу.
        </p>
      </section>
    </main>
  );
}

async function PlanCardsForViewer() {
  const user = await getCurrentUser();
  const viewer = user?.organization ? await getOrganizationPlan(user.organization.id) : null;
  return <PlanCards viewer={viewer} />;
}

/** Оформление карточек как в макете: белая, синяя и тёмно-синяя. */
const looks: Record<
  Plan["tier"],
  { card: string; title: string; muted: string; check: string; commission: string }
> = {
  FREE: {
    card: "border-2 border-gray-900/80 bg-white text-gray-900",
    title: "text-[#4a5d8c]",
    muted: "text-gray-500",
    check: "bg-brand-mist text-brand-dark",
    commission: "bg-brand-mist text-brand-dark",
  },
  PRO: {
    card: "bg-brand text-white shadow-[0_24px_60px_-12px_rgb(32_116_168/0.55)]",
    title: "text-white",
    muted: "text-white/80",
    check: "bg-white text-brand",
    commission: "bg-brand-dark text-white",
  },
  HOLDING: {
    card: "bg-brand-navy text-white shadow-[0_24px_60px_-12px_rgb(23_55_128/0.6)]",
    title: "text-white",
    muted: "text-white/80",
    check: "bg-white/90 text-brand-navy",
    commission: "bg-brand text-white",
  },
};

/**
 * Карточки тарифов. `viewer`: тариф вошедшего предприятия, null — гость,
 * undefined — пока не известно (кнопки не показываем).
 */
function PlanCards({ viewer }: { viewer: OrganizationPlan | null | undefined }) {
  return (
    <ul className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
      {plans.map((p) => {
        const look = looks[p.tier];
        return (
          <li key={p.tier}>
            <article
              className={`flex h-full flex-col gap-5 rounded-[1.75rem] p-6 md:p-7 ${look.card}`}
            >
              <div className="flex flex-col gap-1">
                <h2
                  className={`font-display text-4xl [overflow-wrap:anywhere] uppercase max-sm:text-3xl md:text-5xl ${look.title}`}
                >
                  {p.name}
                </h2>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-display text-3xl max-sm:text-2xl md:text-4xl">
                    {p.price ? rub(p.price) : "0 ₽"}
                  </span>
                  {p.price > 0 && <span className="text-sm font-bold">/ месяц</span>}
                </p>
                <p className={`text-sm font-bold ${look.muted}`}>{p.tagline}</p>
              </div>
              <hr className={p.price ? "border-white/25" : "border-gray-200"} />
              <ul className="flex flex-col gap-4">
                {p.perks.map((perk) => (
                  <li key={perk.title} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${look.check}`}
                    >
                      <CheckIcon className="size-3.5" />
                    </span>
                    <span>
                      <b className="block font-extrabold">{perk.title}</b>
                      <span className={look.muted}>{perk.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p
                className={`mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl px-5 py-4 ${look.commission}`}
              >
                <span className="text-sm font-extrabold">Комиссия со сделки</span>
                <span className="font-display text-2xl whitespace-nowrap md:text-3xl">
                  {p.commissionLabel}
                </span>
              </p>
              <PlanAction plan={p} viewer={viewer} />
            </article>
          </li>
        );
      })}
    </ul>
  );
}

const cta =
  "block w-full cursor-pointer rounded-full px-5 py-3 text-center font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2";

function PlanAction({ plan, viewer }: { plan: Plan; viewer: OrganizationPlan | null | undefined }) {
  const dark = plan.price > 0;
  const tone = dark
    ? "bg-white text-brand-dark hover:bg-brand-gray focus-visible:outline-white"
    : "bg-brand text-white hover:bg-brand-dark focus-visible:outline-brand";
  if (viewer === undefined) return <span className={`${cta} invisible`}>…</span>;
  if (viewer?.tier === plan.tier) {
    return (
      <Link
        href={routes.plan}
        className={`${cta} ${dark ? "bg-white/15 text-white" : "bg-brand/10 text-brand-dark"}`}
      >
        {viewer.until ? `Ваш тариф до ${formatDate(viewer.until)}` : "Ваш тариф"}
      </Link>
    );
  }
  if (!viewer) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={
            plan.price
              ? `${routes.login}?next=${encodeURIComponent(routes.pricing)}`
              : routes.register
          }
          className={`${cta} ${tone}`}
        >
          {plan.price ? "Войти и подключить" : "Зарегистрироваться"}
        </Link>
        <GuestLogin next={routes.pricing} tone={dark ? "light" : "outline"} />
      </div>
    );
  }
  if (!plan.price) {
    return (
      <p className={`text-center text-sm ${dark ? "text-white/70" : "text-gray-500"}`}>
        Включится сам, когда закончится оплаченный тариф
      </p>
    );
  }
  return (
    <form action={buyPlan.bind(null, plan.tier, routes.plan)}>
      <button type="submit" className={`${cta} ${tone}`}>
        Подключить {plan.name}
      </button>
    </form>
  );
}
