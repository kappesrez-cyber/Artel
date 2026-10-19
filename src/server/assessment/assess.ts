import { plural } from "@/components/labels";

/**
 * ИИ-сводка о предприятии: пункты проверки и итог в пару слов. Здесь только правила,
 * без базы: из фактов о предприятии получаются пункты, индекс доверия 0–100 и итог.
 * Пока это правила, а не языковая модель: так сводка воспроизводима и объяснима,
 * а модель позже сможет дописывать пункты в `external`.
 */

export type PointKind = "ok" | "warn" | "bad";

export type AssessmentPoint = {
  kind: PointKind;
  text: string;
  /** `platform` — из данных ПромПула, `external` — внешние проверки (ФНС, суды, выезд). */
  source: "platform" | "external";
};

/** Тревожные признаки из внешних проверок, которые сами по себе определяют итог. */
export type ExternalFlag = "reseller" | "late";

/** Результаты внешних проверок. Сохраняются в сводке и не теряются при пересчёте. */
export type ExternalChecks = {
  facts?: { kind: PointKind; text: string; weight?: number }[];
  flags?: ExternalFlag[];
  /** Свой вывод для покупателя вместо стандартного. */
  summary?: string;
};

export type CompanyFacts = {
  isSeller: boolean;
  foundedYear: number | null;
  verified: boolean;
  /** Годы, за которые загружена финансовая отчётность. */
  financialYears: number[];
  /** Сертификаты, декларации, лицензии и документы о качестве. */
  certificates: number;
  completedDeals: number;
  cancelledDeals: number;
  totalDeals: number;
  reviewsCount: number;
  averageRating: number | null;
  products: number;
  productsWithAnalogs: number;
};

export type Tone = "RELIABLE" | "GOOD" | "CAUTION" | "RISK";

export type Assessment = {
  verdict: string;
  tone: Tone;
  score: number;
  summary: string;
  points: AssessmentPoint[];
};

const defaultWeight: Record<PointKind, number> = { ok: 6, warn: -6, bad: -15 };

const rating = (n: number) => n.toFixed(1).replace(".", ",");

export function assess(facts: CompanyFacts, external: ExternalChecks = {}, now = new Date()) {
  const points: AssessmentPoint[] = [];
  let sum = 0;
  const add = (kind: PointKind, text: string, weight: number) => {
    points.push({ kind, text, source: "platform" });
    sum += weight;
  };

  const age = facts.foundedYear === null ? null : now.getFullYear() - facts.foundedYear;
  if (age === null) add("warn", "Год основания не указан", -4);
  else if (age >= 10)
    add("ok", `На рынке ${plural(age, "год", "года", "лет")}, с ${facts.foundedYear}`, 10);
  else if (age >= 5)
    add("ok", `На рынке ${plural(age, "год", "года", "лет")}, с ${facts.foundedYear}`, 6);
  else if (age >= 2) add("ok", `На рынке с ${facts.foundedYear} года`, 2);
  else add("warn", `Компания молодая: основана в ${facts.foundedYear} году`, -8);

  if (facts.verified) add("ok", "Реквизиты сверены с ЕГРЮЛ", 8);
  else add("warn", "Реквизиты ещё не сверены с ЕГРЮЛ", -6);

  const years = [...new Set(facts.financialYears)].sort((a, b) => a - b);
  if (years.length >= 3) {
    add("ok", `Финансовая отчётность с ${years[0]} года загружена и проверена`, 12);
  } else if (years.length > 0) {
    add(
      "ok",
      `Финансовая отчётность за ${years.join(" и ")} ${years.length > 1 ? "годы" : "год"} загружена`,
      4,
    );
  } else {
    add("warn", "Финансовая отчётность не загружена", -8);
  }

  if (facts.certificates > 0) {
    add(
      "ok",
      `${plural(facts.certificates, "сертификат или декларация", "сертификата и декларации", "сертификатов и деклараций")} соответствия`,
      6,
    );
  } else if (facts.isSeller) {
    add("warn", "Нет сертификатов и деклараций соответствия", -4);
  }

  const deals = plural(
    facts.completedDeals,
    "успешная сделка",
    "успешные сделки",
    "успешных сделок",
  );
  const n = facts.completedDeals;
  if (n >= 30) {
    const genitive = n % 10 === 1 && n % 100 !== 11 ? "успешной сделки" : "успешных сделок";
    add("ok", `Более ${n} ${genitive} на платформе`, 14);
  } else if (n >= 10) add("ok", `${deals} на платформе`, 8);
  else if (n > 0) add("ok", `${deals} на платформе`, 3);
  else add("warn", "Пока ни одной завершённой сделки", -6);

  const cancelledShare = facts.totalDeals ? facts.cancelledDeals / facts.totalDeals : 0;
  if (facts.cancelledDeals >= 2 && cancelledShare >= 0.3) {
    add("bad", `Сорвано ${facts.cancelledDeals} из ${facts.totalDeals} сделок`, -16);
  } else if (facts.cancelledDeals > 0 && cancelledShare >= 0.15) {
    add("warn", `Отменено ${facts.cancelledDeals} из ${facts.totalDeals} сделок`, -4);
  }

  if (facts.averageRating !== null && facts.reviewsCount >= 3) {
    const text = `Средняя оценка ${rating(facts.averageRating)} из 5 по ${plural(facts.reviewsCount, "отзыву", "отзывам", "отзывам")}`;
    if (facts.averageRating >= 4.5) add("ok", text, 10);
    else if (facts.averageRating >= 4) add("ok", text, 4);
    else if (facts.averageRating >= 3.5) add("warn", text, -4);
    else add("bad", text, -14);
  }

  if (facts.isSeller) {
    if (facts.products === 0) add("warn", "Каталог пуст", -2);
    else if (facts.productsWithAnalogs > 0) {
      add(
        "ok",
        `В каталоге ${plural(facts.products, "позиция", "позиции", "позиций")}, для ${facts.productsWithAnalogs} указан импортный оригинал`,
        0,
      );
    }
  }

  for (const fact of external.facts ?? []) {
    points.push({ kind: fact.kind, text: fact.text, source: "external" });
    sum += fact.weight ?? defaultWeight[fact.kind];
  }

  const score = Math.max(7, Math.min(98, Math.round(40 + sum * 0.65)));
  const bad = points.filter((p) => p.kind === "bad").length;
  const flags = new Set(external.flags ?? []);
  const who = facts.isSeller ? "производитель" : "заказчик";

  let verdict: string;
  let tone: Tone;
  if (flags.has("reseller")) [verdict, tone] = ["Перекуп-пустышка", "RISK"];
  else if (flags.has("late")) [verdict, tone] = ["Срывает сроки", score < 35 ? "RISK" : "CAUTION"];
  else if (bad >= 2 || (bad === 1 && score < 35)) [verdict, tone] = ["Высокий риск", "RISK"];
  else if (score >= 78 && facts.completedDeals >= 30)
    [verdict, tone] = [`Надёжный ${who}`, "RELIABLE"];
  else if (age !== null && age < 3 && score >= 55 && bad === 0)
    [verdict, tone] = ["Молодой и перспективный", "GOOD"];
  else if (score >= 62 && bad === 0) [verdict, tone] = [`Проверенный ${who}`, "GOOD"];
  else if ((facts.completedDeals === 0 && years.length === 0) || (score < 45 && bad === 0))
    [verdict, tone] = ["Мало данных", "CAUTION"];
  else [verdict, tone] = ["Нужна проверка", "CAUTION"];

  return {
    verdict,
    tone,
    score,
    summary: external.summary ?? summaries[verdict.split(" ")[0]!] ?? summaries["Нужна"]!,
    points,
  } satisfies Assessment;
}

/** Вывод для покупателя по первому слову итога. */
const summaries: Record<string, string> = {
  "Перекуп-пустышка":
    "Своего производства нет: позиции перепродаются с наценкой. Работать не рекомендуем.",
  Срывает:
    "Производство настоящее, но сроки срываются. Закладывайте запас по времени и не берите полную предоплату.",
  Высокий:
    "Слишком много тревожных сигналов. Перед сделкой запросите документы и работайте через безопасную сделку.",
  Надёжный: "Можно работать без лишних проверок: история сделок и отчётность подтверждены.",
  Молодой:
    "Компания молодая, но всё, что можно проверить, в порядке. Хороший вариант для пробной партии.",
  Проверенный: "Серьёзных рисков не видно. Для крупной партии стоит запросить свежую отчётность.",
  Мало: "Данных пока мало для вывода. Попросите загрузить отчётность и начните с небольшой партии.",
  Нужна: "Есть вопросы, которые стоит прояснить до сделки.",
};
