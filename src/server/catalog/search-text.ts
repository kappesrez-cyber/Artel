import "server-only";
import { stem, synonymsFor } from "./synonyms";

export { stem };

/**
 * Разбор поискового запроса и текста позиции. Здесь только чистые функции: SQL строится
 * в `search.ts`, а морфологию (подшипника → подшипник) делает PostgreSQL (`russian`).
 */

/** Сколько слов запроса учитываем: длинные вставки текста не должны превращаться в тяжёлый SQL. */
export const MAX_TERMS = 8;

/** Нижний регистр, ё → е, всё кроме букв и цифр — пробелы. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Слова, которые не несут смысла для поиска: служебные (список PostgreSQL `russian.stop`)
 * и типичные для запросов закупщика («нужен», «купить», «ООО»). Раньше «подшипник для
 * комбайна» требовал слова «для» в карточке и ничего не находил.
 */
const STOP_WORDS = new Set(
  (
    "и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее " +
    "мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть " +
    "был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть " +
    "надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда " +
    "кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее сейчас " +
    "были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот " +
    "через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед " +
    "иногда лучше чуть том нельзя такой им более всегда конечно всю между " +
    // Слова из запросов закупщика, которые не описывают саму позицию.
    "нужен нужна нужно нужны надо купить куплю ищу ищем найти заказать закажу продам продажа " +
    "цена стоимость недорого дешево срочно аналог аналоги аналога замена замену заменить " +
    "импортный импортного импортная отечественный отечественная российский российская " +
    "производство производитель поставка поставщик шт штук ооо оао зао пао ао ип г гор город"
  ).split(" "),
);

// Набор на английской раскладке вместо русской: «gjlibgybr» → «подшипник».
const LAYOUT_EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const LAYOUT_RU = "йцукенгшщзхъфывапролджэячсмитьбюё";

/** Перевести слово, набранное в английской раскладке, на русскую. */
export function switchLayout(word: string): string {
  return [...word].map((ch) => LAYOUT_RU[LAYOUT_EN.indexOf(ch)] ?? ch).join("");
}

// Кириллица, похожая на латиницу: в артикулах «6205-2RS» часто набирают русские «Р» и «С».
const LOOKALIKE: Record<string, string> = {
  а: "a",
  в: "b",
  е: "e",
  к: "k",
  м: "m",
  н: "h",
  о: "o",
  р: "p",
  с: "c",
  т: "t",
  у: "y",
  х: "x",
};

/** Похож ли кусок текста на артикул: есть цифра и он не просто число из 1–2 знаков. */
export function isCode(token: string): boolean {
  return /\p{N}/u.test(token) && token.length >= 3;
}

// Как покупатель набирает латинский артикул русскими буквами по звучанию: «2рс» → «2rs».
const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
};

const mapChars = (text: string, table: Record<string, string>) =>
  [...text].map((ch) => table[ch] ?? ch).join("");

/** Артикул без разделителей, в нижнем регистре: «ПШ-6205-2RS» → «пш62052rs». */
export function compactCode(code: string): string {
  return code
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Написания артикула, под которыми его стоит искать: как есть, с латиницей вместо
 * похожей кириллицы («6205-2РС» набрано русскими Р и С → «62052pc») и в транслите
 * («2рс» по звучанию → «2rs»).
 */
export function codeVariants(code: string): string[] {
  const flat = compactCode(code);
  if (!/[а-я]/.test(flat)) return [flat];
  return [...new Set([flat, mapChars(flat, LOOKALIKE), mapChars(flat, TRANSLIT)])];
}

/** Артикулы в тексте: «SKF 6205-2RSH, ПШ-6205» → ["62052rsh", "пш6205"]. */
export function extractCodes(text: string): string[] {
  // Размеры «45×65×10» и «45х65» — тоже артикул: знак умножения считаем разделителем.
  const sized = text.replace(/(\p{N})\s*[×xхX*]\s*(?=\p{N})/gu, "$1-");
  const chunks = sized.match(/[\p{L}\p{N}]+(?:[-./,][\p{L}\p{N}]+)*/gu) ?? [];
  return [
    ...new Set(
      chunks
        .filter(isCode)
        .map(compactCode)
        .filter((c) => c.length >= 3),
    ),
  ];
}

/** Одно смысловое слово запроса. */
export type SearchTerm = {
  /** Слово как в запросе, после нормализации. */
  word: string;
  /**
   * Запрос для `to_tsquery('russian', …)`: слово, его синонимы и вариант в русской раскладке.
   * Только буквы, цифры и операторы `| & ( ) :*`, поэтому безопасно передаётся параметром.
   */
  tsquery: string;
  /** Слово-артикул: варианты написания, которые ищутся слитно в `searchText`. */
  codes: string[];
  /**
   * Можно ли исправлять опечатку в слове. Короткие слова и артикулы не исправляем:
   * «цепь» и «цель» отличаются одной буквой, а «6205» и «6206» — разные подшипники.
   */
  fuzzy: boolean;
  /** Синонимы, добавленные к слову, — для подсказки на странице результатов. */
  synonyms: string[];
};

export type ParsedQuery = {
  /** Нормализованный запрос целиком: для группировки в аналитике и сравнения с названием. */
  normalized: string;
  terms: SearchTerm[];
  /** Артикулы, собранные из соседних слов: «6205 2rs» → «62052rs». */
  codes: string[];
};

const operand = (phrase: string, prefix: boolean) => {
  const words = normalize(phrase).split(" ").filter(Boolean);
  const parts = words.map((w, i) => (prefix && i === words.length - 1 ? `${w}:*` : w));
  return parts.length > 1 ? `(${parts.join(" & ")})` : (parts[0] ?? "");
};

/** Разобрать запрос покупателя на слова, синонимы и артикулы. */
export function parseQuery(query: string): ParsedQuery {
  const normalized = normalize(query);
  const words = [...new Set(normalized.split(" ").filter(Boolean))]
    .filter((w) => !STOP_WORDS.has(w))
    .slice(0, MAX_TERMS);

  const terms = words.map((word, index): SearchTerm => {
    const synonyms = synonymsFor(word);
    const alternatives = [word, ...synonyms];
    // Только латинские буквы и нет такого слова среди синонимов — возможно, не та раскладка.
    if (/^[a-z]+$/.test(word) && word.length >= 4) {
      const russian = switchLayout(word);
      alternatives.push(russian, ...synonymsFor(russian));
    }
    // Префикс — только для последнего слова: покупатель мог не допечатать («подшип»).
    const prefix = index === words.length - 1 && word.length >= 4 && !/\p{N}/u.test(word);
    return {
      word,
      tsquery: [...new Set(alternatives)]
        .map((alt) => operand(alt, prefix && alt === word))
        .filter(Boolean)
        .join(" | "),
      codes: isCode(word) ? codeVariants(word) : [],
      fuzzy: word.length >= 4 && !/\p{N}/u.test(word),
      synonyms,
    };
  });

  // Артикул могли разбить пробелом: «6205 2RS». Склеиваем соседние слова, если в паре есть цифра.
  const tokens = normalized.split(" ").filter((w) => w && !STOP_WORDS.has(w));
  // Обе части короткие («spb 2000», «6205 2rs»), иначе это слово рядом с числом: «подшипник 6205».
  const pairs = tokens.slice(1).flatMap((next, i) => {
    const prev = tokens[i]!;
    const codeLike = /\p{N}/u.test(prev + next) && prev.length <= 6 && next.length <= 6;
    return codeLike && (prev + next).length >= 5 ? [prev + next] : [];
  });
  const codes = [
    ...new Set([...extractCodes(query), ...pairs].flatMap((code) => codeVariants(code))),
  ].filter((code) => code.length >= 5);

  return { normalized, terms, codes };
}

/** Основы смысловых слов запроса — для простого поиска по подстроке (рынок заказов). */
export function searchTerms(query: string): string[] {
  return [...new Set(parseQuery(query).terms.map((t) => stem(t.word)))];
}

/**
 * Сколько слов запроса должна покрыть позиция. Короткий запрос — все слова; в длинном
 * («подшипник 6205 закрытый для комбайна claas») одно-два лишних слова не обнуляют выдачу.
 */
export function requiredMatches(termCount: number): number {
  if (termCount <= 2) return termCount;
  return termCount - Math.floor(termCount / 3);
}

/** Текст, по которому ищется позиция. Хранится в `Product.searchText`. */
export function buildSearchText(parts: {
  name: string;
  article?: string | null;
  analogs?: string | null;
  description?: string | null;
  city: string;
  organizationName: string;
}): string {
  const codes = extractCodes(
    [parts.name, parts.article, parts.analogs].filter(Boolean).join(" "),
  ).flatMap(codeVariants);
  return normalize(
    [
      parts.name,
      parts.article,
      parts.analogs,
      parts.description,
      parts.city,
      parts.organizationName,
      ...codes,
    ]
      .filter(Boolean)
      .join(" "),
  );
}
