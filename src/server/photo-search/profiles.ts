import type { PhotoAngle } from "./angles";

/**
 * Демо-распознавание: детали, которые «модель» узнаёт, и эталонные снимки каждой.
 * Эталоны — те же файлы, что лежат в `public/demo/photo-search` (кнопка «Попробовать на примере»).
 * `fingerprint` — отпечаток снимка из `imageFingerprint` (`src/components/image-tools.ts`).
 */

export type Profile = {
  id: string;
  title: string;
  original: string;
  category: string;
  /** По какому запросу подбирать позиции каталога. */
  query: string;
  attributes: [string, string][];
  references: { file: string; angle: PhotoAngle; fingerprint: string; note: string }[];
};

export const profiles: Profile[] = [
  {
    id: "bearing-6205",
    title: "Подшипник шариковый радиальный 6205-2RS",
    original: "SKF 6205-2RSH",
    category: "Подшипники качения",
    query: "подшипник 6205-2RS",
    attributes: [
      ["Тип", "Шариковый радиальный однорядный"],
      ["Размеры", "25 × 52 × 15 мм"],
      ["Уплотнение", "2RS: резиновое, с двух сторон"],
      ["Маркировка", "SKF 6205-2RSH, Made in Sweden"],
      ["Отечественный аналог", "180205 по ГОСТ 520-2011"],
    ],
    references: [
      {
        file: "bearing-1-front.jpg",
        angle: "front",
        fingerprint: "f0cc96b296cce8f0",
        note: "Торец: наружный ⌀ ≈ 52 мм, внутренний ⌀ ≈ 25 мм, уплотнение закрыто",
      },
      {
        file: "bearing-2-angle.jpg",
        angle: "angle",
        fingerprint: "f0ccd69696cce8f0",
        note: "Резиновые уплотнения с двух сторон — исполнение 2RS",
      },
      {
        file: "bearing-3-side.jpg",
        angle: "side",
        fingerprint: "f0e8e8f0e8e8e8f0",
        note: "Профиль: ширина ≈ 15 мм, лёгкая серия 62xx",
      },
      {
        file: "bearing-4-marking.jpg",
        angle: "marking",
        fingerprint: "8c2e10307078f0f4",
        note: "Прочитана маркировка: SKF 6205-2RSH",
      },
    ],
  },
  {
    id: "filter-0160d010",
    title: "Фильтрующий элемент гидросистемы 10 мкм",
    original: "Hydac 0160 D 010 BN4HC",
    category: "Гидравлика, фильтры",
    query: "Hydac 0160D010BN4HC",
    attributes: [
      ["Тип", "Напорный фильтроэлемент со стекловолокном"],
      ["Тонкость фильтрации", "10 мкм"],
      ["Размеры", "⌀ ≈ 45 мм, высота ≈ 90 мм"],
      ["Маркировка", "HYDAC 0160 D 010 BN4HC"],
      ["Применение", "Гидросистема комбайнов Claas (0007382910)"],
    ],
    references: [
      {
        file: "filter-1-side.jpg",
        angle: "side",
        fingerprint: "f0d4d4d4d4d4d4f0",
        note: "Цилиндрический элемент, перфорированная опорная труба",
      },
      {
        file: "filter-2-angle.jpg",
        angle: "angle",
        fingerprint: "f0ccc4c4d4ccecf0",
        note: "Гофра из стекловолокна, металлические торцевые крышки",
      },
      {
        file: "filter-3-top.jpg",
        angle: "top",
        fingerprint: "f0f0e8d4e8e8f0f0",
        note: "Сверху: посадочное отверстие с уплотнительным кольцом",
      },
      {
        file: "filter-4-label.jpg",
        angle: "marking",
        fingerprint: "b2b2b2d09cb2b2b2",
        note: "Прочитана этикетка: HYDAC 0160 D 010 BN4HC",
      },
    ],
  },
  {
    id: "plow-reversible-4",
    title: "Плуг навесной оборотный, 4 корпуса",
    original: "Lemken EurOpal 7 4N100",
    category: "Почвообработка, плуги",
    query: "плуг оборотный",
    attributes: [
      ["Тип", "Навесной оборотный, переворот гидроцилиндром"],
      ["Корпусов", "4, ширина захвата корпуса ≈ 40 см"],
      ["Рама", "Сплошная, квадрат ≈ 120 × 120 мм"],
      ["Трактор", "140–180 л.с., навеска кат. III"],
      ["Отечественный аналог", "ПНО-4-40 и аналоги"],
    ],
    // Снимки: `public/demo/photo-search/plow-*.jpg`. После замены на свои фото пересчитайте
    // отпечатки: `node scripts/photo-search-fingerprints.mjs`.
    references: [
      {
        file: "plow-1-front.jpg",
        angle: "front",
        fingerprint: "0008080c162a0000",
        note: "Спереди: навесное устройство и механизм оборота, два ряда корпусов",
      },
      {
        file: "plow-2-side.jpg",
        angle: "side",
        fingerprint: "00000040612c0600",
        note: "Сбоку: 4 корпуса на сплошной раме, опорное колесо",
      },
      {
        file: "plow-3-angle.jpg",
        angle: "angle",
        fingerprint: "000060702c230400",
        note: "Под углом: полувинтовые отвалы, лемеха и стойки с защитой",
      },
      {
        file: "plow-4-marking.jpg",
        angle: "marking",
        fingerprint: "ffffe5d9c1c1ffff",
        note: "Прочитан шильдик: оборотный плуг, 4 корпуса × 40 см",
      },
    ],
  },
];
