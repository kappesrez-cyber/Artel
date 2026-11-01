/**
 * Примерный срок доставки между городами: расстояние по прямой с поправкой на дороги
 * и дневной пробег грузовика. Это ориентир для покупателя, точный срок называет производитель.
 */

export type City = { name: string; lat: number; lon: number };

export const cities: City[] = [
  { name: "Москва", lat: 55.76, lon: 37.62 },
  { name: "Санкт-Петербург", lat: 59.94, lon: 30.31 },
  { name: "Белгород", lat: 50.6, lon: 36.59 },
  { name: "Воронеж", lat: 51.67, lon: 39.18 },
  { name: "Волгоград", lat: 48.71, lon: 44.51 },
  { name: "Екатеринбург", lat: 56.84, lon: 60.61 },
  { name: "Казань", lat: 55.79, lon: 49.12 },
  { name: "Краснодар", lat: 45.04, lon: 38.98 },
  { name: "Красноярск", lat: 56.01, lon: 92.89 },
  { name: "Курск", lat: 51.73, lon: 36.19 },
  { name: "Липецк", lat: 52.61, lon: 39.59 },
  { name: "Нижний Новгород", lat: 56.33, lon: 44.0 },
  { name: "Новосибирск", lat: 55.03, lon: 82.92 },
  { name: "Омск", lat: 54.99, lon: 73.37 },
  { name: "Оренбург", lat: 51.77, lon: 55.1 },
  { name: "Пермь", lat: 58.01, lon: 56.23 },
  { name: "Ростов-на-Дону", lat: 47.23, lon: 39.72 },
  { name: "Сальск", lat: 46.48, lon: 41.54 },
  { name: "Самара", lat: 53.2, lon: 50.15 },
  { name: "Саратов", lat: 51.53, lon: 46.03 },
  { name: "Ставрополь", lat: 45.04, lon: 41.97 },
  { name: "Тамбов", lat: 52.72, lon: 41.45 },
  { name: "Тула", lat: 54.19, lon: 37.62 },
  { name: "Тюмень", lat: 57.15, lon: 65.53 },
  { name: "Уфа", lat: 54.73, lon: 55.96 },
  { name: "Челябинск", lat: 55.16, lon: 61.4 },
  { name: "Ярославль", lat: 57.63, lon: 39.87 },
];

export function findCity(name: string): City | undefined {
  const key = name.trim().toLowerCase().replace(/ё/g, "е");
  return cities.find((c) => c.name.toLowerCase().replace(/ё/g, "е") === key);
}

/** Расстояние по дорогам, км: по прямой × 1,25. */
export function roadKm(from: City, to: City): number {
  const rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad;
  const dLon = (to.lon - from.lon) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLon / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(a));
  return Math.round(km * 1.25);
}

/** Дней в пути: по городу — день, иначе 600 км в сутки плюс день на погрузку. */
export function transitDays(km: number): number {
  return km < 50 ? 1 : Math.ceil(km / 600) + 1;
}
