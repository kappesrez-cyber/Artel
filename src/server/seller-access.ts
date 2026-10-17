import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * Временная защита API продавца, пока нет входа в аккаунт.
 *
 * Запросы на запись в каталог должны нести заголовок `Authorization: Bearer <SELLER_API_TOKEN>`.
 * Если переменная не задана, API продавца выключено. Когда появится авторизация, эту функцию
 * заменит проверка сессии и того, что пользователь состоит в организации из адреса запроса.
 */
export function checkSellerAccess(request: Request): Response | null {
  const token = env().SELLER_API_TOKEN;
  if (!token) {
    return Response.json({ error: "API продавца выключено" }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(token);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: "Нужен ключ продавца" }, { status: 401 });
  }
  return null;
}
