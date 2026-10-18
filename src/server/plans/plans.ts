import "server-only";
import type { PlanTier } from "@/generated/prisma/client";

/**
 * Тарифы предприятия. Всё, что тариф меняет, задаётся здесь: цена, комиссия платформы
 * с успешной сделки, бонусные звёзды, подъём позиций в поиске и помощь с документами.
 */
export type Plan = {
  tier: PlanTier;
  name: string;
  /** Цена за месяц в рублях. */
  price: number;
  tagline: string;
  /** Комиссия платформы с суммы успешной сделки, в процентах. */
  commission: number;
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
  /** Карточка выделена на странице тарифов как самая популярная. */
  popular?: boolean;
};

export const plans: readonly Plan[] = [
  {
    tier: "FREE",
    name: "Free",
    price: 0,
    tagline: "Попробовать платформу: каталог, поиск, рынок заказов",
    commission: 5,
    bonusStars: 0,
    searchBoost: 0,
    docsHelp: false,
    support: "Почта",
  },
  {
    tier: "PRO",
    name: "Pro",
    price: 2500,
    tagline: "Для небольшого производства с регулярными сделками",
    commission: 3,
    bonusStars: 5,
    searchBoost: 0.1,
    docsHelp: false,
    support: "Чат",
  },
  {
    tier: "MAX",
    name: "Max",
    price: 7000,
    tagline: "Для заводов, которые активно продают и закупают",
    commission: 2,
    bonusStars: 20,
    searchBoost: 0.25,
    docsHelp: false,
    support: "Чат без очереди",
    popular: true,
  },
  {
    tier: "ULTRA",
    name: "Ultra",
    price: 35000,
    tagline: "Крупные контракты под ключ: с документами помогает юрист платформы",
    commission: 1,
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

/** Тариф, который действует сейчас: оплаченный срок истёк — значит Free. */
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
