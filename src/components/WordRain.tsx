import type { CSSProperties } from "react";

/** Что ищут и заказывают на платформе: узлы, детали, ингредиенты, производство. */
export const RAIN_WORDS = [
  "подшипник 6205-2RS",
  "гидроцилиндр",
  "манжета 45×65×10",
  "аналог SKF",
  "редуктор",
  "ремень SPB 2000",
  "форсунка common rail",
  "цепь ПР-25,4",
  "импортозамещение",
  "вал жатки",
  "чертёж DWG",
  "токарная обработка",
  "гомогенизатор",
  "датчик скорости",
  "замена Claas",
  "уплотнение",
  "закваска для сыра",
  "звёздочка",
  "ГОСТ",
  "шнек",
  "нержавейка AISI 304",
  "опытный образец",
  "сегмент ножа",
  "аналог Bosch Rexroth",
  "гидромотор",
  "литьё под давлением",
  "фильтр гидравлический",
  "ЧПУ",
  "амилаза",
  "теплообменник",
  "серийная партия",
  "муфта",
  "клапан",
  "контрактное производство",
  "электродвигатель",
  "ТЗ и спецификация",
  "конвейерная лента",
  "кооперация",
  "частотный преобразователь",
  "шестерня",
  "сепаратор",
  "3D-модель",
  "ротор",
  "РВД",
  "сертификат ТР ТС",
  "мембрана",
  "термопара",
  "лемех",
] as const;

const COLUMNS = 9;

// Скорость, начальный сдвиг и размер у колонок разные, чтобы поток не выглядел сеткой.
const timing = [64, 82, 58, 90, 70, 96, 61, 78, 86];
const delays = [-12, -40, -25, -5, -55, -30, -18, -62, -8];
const sizes = [26, 20, 30, 22, 24, 20, 28, 22, 25];

/**
 * Фон главной страницы: слова по теме платформы падают колонками сверху вниз.
 * Чистый CSS без JS: каждая колонка — один слой, который сдвигается через transform.
 * В центре, где заголовок и строка поиска, слова гаснут маской; при prefers-reduced-motion
 * поток стоит на месте.
 */
export function WordRain({ className = "" }: { className?: string }) {
  // В колонке примерно 20 слов: одна копия списка выше экрана даже на телефоне.
  const columns = Array.from({ length: COLUMNS }, (_, c) =>
    [0, 4, 7, 2].flatMap((shift) => RAIN_WORDS.filter((_, i) => (i + shift) % COLUMNS === c)),
  );
  return (
    <div
      aria-hidden
      className={`word-rain pointer-events-none absolute inset-0 -z-10 flex justify-between overflow-hidden px-[calc(var(--u)*20)] select-none ${className}`}
    >
      {columns.map((words, c) => (
        <div
          key={c}
          className={`relative h-full w-[calc(100%/9)] min-w-0 px-1 ${c % 2 === 1 ? "max-md:hidden" : ""}`}
        >
          <ul
            className="word-rain-track flex flex-col items-center will-change-transform"
            style={
              {
                "--fall": `${timing[c]}s`,
                "--fall-delay": `${delays[c]}s`,
                fontSize: `max(calc(var(--u) * ${sizes[c]}), 13px)`,
              } as CSSProperties
            }
          >
            {/* Список дважды: когда первая копия уезжает вниз, сверху уже вторая, шва не видно. */}
            {[0, 1].map((copy) =>
              words.map((word, i) => (
                <li
                  key={`${copy}-${i}`}
                  className={`pb-[max(calc(var(--u)*90),56px)] text-center leading-tight font-bold tracking-[-0.02em] text-balance ${
                    (i + c) % 3 === 0 ? "text-brand-dark/20" : "text-brand/[0.18]"
                  }`}
                >
                  {word}
                </li>
              )),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
