import "server-only";
import type { PlanTier } from "@/generated/prisma/client";

/**
 * Тарифы предприятия (макет «Тарифы»: Старт, Про, Холдинг). Всё, что тариф меняет, задаётся
 * здесь: цена, комиссия платформы с успешной сделки, пункты карточки, бонусные звёзды,
 * подъём позиций в поиске и помощь с документами.
 */
export type Plan = {
  tier: PlanTier;
  name: string;
  /** Цена за месяц в рублях. */
  price: number;
  /** Для кого тариф — подпись под ценой. */
  tagline: string;
  /**
   * Комиссия платформы с суммы успешной сделки, в процентах: по ней считаются суммы.
   * На карточке показывается `commissionLabel` (у Старта и Про — вилка, берём верхнюю границу).
   */
  commission: number;
  commissionLabel: string;
  /** Пункты карточки: заголовок жирным и пояснение. */
  perks: { title: string; text: string }[];
  /** Звёзды, которые зачисляются при оплате каждого месяца. */
  bonusStars: number;
  /**
   * Прибавка к репутации продавца в ранжировании поиска (0…0.5; сама репутация — 0…1).
   * Работает только между одинаково подходящими позициями: релевантность важнее тарифа.
   */
  searchBoost: number;
  /** Юрист платформы готовит договор, спецификацию и закрывающие документы по сделке. */
  docsHelp: boolean;
  support: string;
};

export const plans: readonly Plan[] = [
  {
    tier: "FREE",
    name: "Старт",
    price: 0,
    tagline: "Бесплатно навсегда для заказчиков",
    commission: 9,
    commissionLabel: "8–9%",
    perks: [
      { title: "Заказчикам (АПК/Фудтех):", text: "бесплатно навсегда" },
      { title: "Открытая витрина", text: "трендов и базовый профиль в каталоге." },
      { title: "Тест для цехов:", text: "1 отклик в месяц (заказы до 300\u00a0000\u00a0₽)." },
      { title: "Полный объём комиссии", text: "комиссии при продаже" },
    ],
    bonusStars: 0,
    searchBoost: 0,
    docsHelp: false,
    support: "Почта",
  },
  {
    tier: "PRO",
    name: "Про",
    price: 27_000,
    tagline: "Для цехов и производств",
    commission: 5,
    commissionLabel: "4–5%",
    perks: [
      {
        title: "Полная аналитика спроса:",
        text: "бюджеты пулов в рублях, динамика и целевые цены.",
      },
      { title: "Конструктор коллабораций:", text: "автосборка консорциумов под ваши станки." },
      {
        title: "Безлимитный доступ:",
        text: "скачивание CAD-чертежей и отклики на любые объёмы.",
      },
    ],
    bonusStars: 20,
    searchBoost: 0.25,
    docsHelp: false,
    support: "Чат без очереди",
  },
  {
    tier: "HOLDING",
    name: "Холдинг",
    price: 149_000,
    tagline: "Для холдингов с сетью филиалов",
    commission: 0,
    commissionLabel: "0%",
    perks: [
      { title: "Внутренний пулинг:", text: "синхронизация спроса 20–40 филиалов холдинга." },
      { title: "Интеграция под ключ:", text: "бесшовный обмен с 1С:ERP / SAP и API к базе." },
      {
        title: "Закрытый пул исполнителей:",
        text: "подрядчики с высшим скорингом и пищевой приёмкой.",
      },
    ],
    bonusStars: 100,
    searchBoost: 0.5,
    docsHelp: true,
    support: "Персональный менеджер",
  },
];

/** Сколько дней действует оплаченный месяц тарифа. */
export const PLAN_DAYS = 30;

export function getPlan(tier: PlanTier): Plan {
  return plans.find((p) => p.tier === tier)!;
}

/** Тариф, который действует сейчас: оплаченный срок истёк — значит Старт. */
export function effectiveTier(
  org: { plan: PlanTier; planUntil: Date | null },
  now = new Date(),
): PlanTier {
  return org.plan !== "FREE" && org.planUntil && org.planUntil > now ? org.plan : "FREE";
}

/** Комиссия платформы с суммы сделки, в рублях с копейками. */
export function commissionFor(tier: PlanTier, amount: number): number {
  return Math.round(amount * getPlan(tier).commission) / 100;
}

/**
 * До какого момента действует тариф после оплаты месяца. Продление того же тарифа
 * добавляет месяц к оставшемуся сроку; другой тариф начинается сразу.
 */
export function nextPlanUntil(
  current: { plan: PlanTier; planUntil: Date | null },
  bought: PlanTier,
  now = new Date(),
): Date {
  const from =
    effectiveTier(current, now) === bought && current.planUntil ? current.planUntil : now;
  return new Date(from.getTime() + PLAN_DAYS * 24 * 60 * 60 * 1000);
}
