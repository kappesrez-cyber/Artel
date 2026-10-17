import "server-only";

/** Сколько слов запроса учитываем: длинные вставки текста не должны превращаться в тяжёлый SQL. */
const MAX_TERMS = 8;

// Частые окончания русских слов: «детали», «деталью» и «деталь» должны находить друг друга.
const ENDINGS =
  /(иями|ями|ами|ией|ого|его|ому|ему|ыми|ими|ов|ев|ей|ой|ий|ый|ая|яя|ое|ее|ые|ие|ам|ям|ах|ях|ом|ем|ию|ия|а|я|о|е|ы|и|ь|у|ю|й)$/;

/** Нижний регистр, ё → е, всё кроме букв и цифр — пробелы. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Грубая основа слова: отбрасываем окончание, если остаётся хотя бы 3 буквы. */
export function stem(word: string): string {
  const cut = word.replace(ENDINGS, "");
  return cut.length >= 3 ? cut : word;
}

/** Слова запроса для поиска: каждое должно встретиться в тексте позиции. */
export function searchTerms(query: string): string[] {
  const words = normalize(query).split(" ").filter(Boolean);
  return [...new Set(words.map(stem))].slice(0, MAX_TERMS);
}

/** Текст, по которому ищется позиция. Хранится в `Product.searchText`. */
export function buildSearchText(parts: {
  name: string;
  description?: string | null;
  city: string;
  organizationName: string;
}): string {
  return normalize(
    [parts.name, parts.description, parts.city, parts.organizationName].filter(Boolean).join(" "),
  );
}
