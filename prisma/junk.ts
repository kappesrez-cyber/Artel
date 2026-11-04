// Распознаёт карточки и заказы, которые заводили «для проверки»: «тест», «asdf», «123»,
// «ааааа». Сид удаляет их из демо-базы (`removeJunk` в `seed.ts`). Правила осторожные:
// «Тестомес» или «тесто» мусором не считаются.

const junkWords = new Set([
  "тест",
  "тесты",
  "тестовый",
  "тестовая",
  "тестовое",
  "тестовые",
  "тестовой",
  "тестирование",
  "test",
  "tests",
  "testing",
  "asdf",
  "asd",
  "qwe",
  "qwerty",
  "йцукен",
  "йцу",
  "фыва",
  "ячсм",
  "lorem",
  "ipsum",
  "ерунда",
  "фигня",
  "хрень",
  "абвгд",
  "абв",
  "проверка",
]);

export function isJunkText(text: string | null | undefined): boolean {
  const t = (text ?? "").trim().toLowerCase();
  if (!t) return false;
  // Меньше трёх букв: «123», «..», «аа».
  if ((t.match(/\p{L}/gu) ?? []).length < 3) return true;
  // Одна буква подряд пять раз и больше: «ааааа», «ffffff».
  if (/(\p{L})\1{4,}/u.test(t)) return true;
  const words = t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.some((w) => junkWords.has(w) && w !== "проверка")) return true;
  // Набор подряд по клавиатуре: «asdfgh», «qwerty123», «йцукенг», «фывапр».
  if (words.some((w) => /^(asdf|qwer|zxcv|йцук|фыва|ячсм)/.test(w))) return true;
  // «Проверка» и «для проверки» — мусор только в коротком тексте: «Проверка 2», «для проверки».
  return t.length <= 40 && /(^|[^\p{L}])(проверка|проверки|проверить)([^\p{L}]|$)/u.test(t);
}
