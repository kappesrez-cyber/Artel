import "server-only";

/**
 * Пакеты звёзд. Звезда — единица платного продвижения заказа на рынке: чем больше звёзд
 * вложено в заказ (заказчиком и всеми, кто к нему присоединился), тем выше он в списке.
 */
export const starPackages = [
  { stars: 1, price: 100 },
  { stars: 5, price: 450 },
  { stars: 10, price: 800 },
  { stars: 25, price: 1750 },
] as const;

export type StarPackage = (typeof starPackages)[number];

/** Пакет по числу звёзд. Произвольное количество не продаём: цена задаётся только здесь. */
export function findStarPackage(stars: number): StarPackage | undefined {
  return starPackages.find((p) => p.stars === stars);
}

/** Сколько вкладывать за раз: защита от опечатки «1000». */
export const MAX_BOOST_STARS = 100;
