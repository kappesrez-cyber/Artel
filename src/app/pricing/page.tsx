import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
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
    value: (p) => `${p.commission}%`,
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
  { label: "Каталог, поиск, рынок заказов, аналитика", value: () => <Yes /> },
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

/** Ключевые пункты карточки тарифа. */
function features(p: Plan): string[] {
  return [
    `Комиссия ${p.commission}% с успешной сделки`,
    p.bonusStars ? `${p.bonusStars} бонусных звёзд в месяц` : "Звёзды покупаются отдельно",
    p.searchBoost ? `Приоритет в поиске ${boost(p)}` : "Обычный порядок в поиске",
    ...(p.docsHelp ? ["Юрист готовит документы по сделке"] : []),
    `Поддержка: ${p.support.toLowerCase()}`,
  ];
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-[calc(var(--u)*90)] px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-brand-dark text-4xl leading-tight md:text-6xl">Тарифы</h1>
        <p className="max-w-2xl text-lg text-balance text-gray-600">
          Чем выше тариф, тем меньше комиссия с каждой сделки и тем заметнее ваши позиции и заказы.
          Оплата помесячно, сменить тариф можно в любой момент.
        </p>
      </header>

      <Suspense fallback={<PlanCards viewer={undefined} />}>
        <PlanCardsForViewer />
      </Suspense>

      <section aria-labelledby="compare" className="flex flex-col gap-6">
        <h2 id="compare" className="text-center text-3xl font-extrabold tracking-[-0.01em]">
          Сравнение тарифов
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-gray-200/80 bg-white shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-center">
            <thead>
              <tr>
                <th scope="col" className="w-[34%] p-5 text-left text-sm font-bold text-gray-500">
                  Что входит
                </th>
                {plans.map((p) => (
                  <th
                    key={p.tier}
                    scope="col"
                    className={`p-5 text-xl font-extrabold ${p.popular ? "bg-brand/[0.07] text-brand-dark" : "text-gray-900"}`}
                  >
                    {p.name}
                    {p.popular && (
                      <span className="text-brand block text-xs font-bold tracking-wide uppercase">
                        популярный
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100">
                  <th scope="row" className="p-5 text-left font-bold text-gray-800">
                    {row.label}
                    {row.hint && (
                      <span className="block text-sm font-normal text-gray-500">{row.hint}</span>
                    )}
                  </th>
                  {plans.map((p) => (
                    <td
                      key={p.tier}
                      className={`p-5 font-bold text-gray-700 ${p.popular ? "bg-brand/[0.07]" : ""}`}
                    >
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

/**
 * Карточки тарифов. `viewer`: тариф вошедшего предприятия, null — гость,
 * undefined — пока не известно (кнопки не показываем).
 */
function PlanCards({ viewer }: { viewer: OrganizationPlan | null | undefined }) {
  return (
    <ul className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((p) => (
        <li key={p.tier} className={p.popular ? "lg:-my-4" : undefined}>
          <article
            className={`relative flex h-full flex-col gap-5 rounded-[2rem] p-7 ${
              p.popular
                ? "bg-brand-dark text-white shadow-[0_24px_60px_-12px_rgb(25_88_126/0.55)] lg:py-11"
                : "border border-gray-200/80 bg-white shadow-[var(--shadow-soft)]"
            }`}
          >
            {p.popular && (
              <span className="text-brand-dark absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-sm font-extrabold whitespace-nowrap shadow-[var(--shadow-soft)]">
                Популярный выбор
              </span>
            )}
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-3xl">{p.name}</h2>
              <p className={`text-sm ${p.popular ? "text-white/75" : "text-gray-500"}`}>
                {p.tagline}
              </p>
            </div>
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {p.price ? rub(p.price) : "0 ₽"}
              </span>
              <span className={p.popular ? "text-white/70" : "text-gray-500"}>/ месяц</span>
            </p>
            <ul className="flex flex-col gap-2.5">
              {features(p).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckIcon
                    className={`mt-0.5 size-5 shrink-0 ${p.popular ? "text-white" : "text-brand"}`}
                  />
                  <span className={p.popular ? "text-white/90" : "text-gray-700"}>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <PlanAction plan={p} viewer={viewer} />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

const cta =
  "block w-full cursor-pointer rounded-full px-5 py-3 text-center font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2";

function PlanAction({ plan, viewer }: { plan: Plan; viewer: OrganizationPlan | null | undefined }) {
  const tone = plan.popular
    ? "bg-white text-brand-dark hover:bg-brand-gray focus-visible:outline-white"
    : "bg-brand text-white hover:bg-brand-dark focus-visible:outline-brand";
  if (viewer === undefined) return <span className={`${cta} invisible`}>…</span>;
  if (viewer?.tier === plan.tier) {
    return (
      <Link
        href={routes.plan}
        className={`${cta} ${plan.popular ? "bg-white/15 text-white" : "bg-brand/10 text-brand-dark"}`}
      >
        {viewer.until ? `Ваш тариф до ${formatDate(viewer.until)}` : "Ваш тариф"}
      </Link>
    );
  }
  if (!viewer) {
    return (
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
    );
  }
  if (!plan.price) {
    return (
      <p className={`text-center text-sm ${plan.popular ? "text-white/70" : "text-gray-500"}`}>
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
