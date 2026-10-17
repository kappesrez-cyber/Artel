import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Случайный токен сессии для cookie (256 бит). */
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** В базе хранится только хэш: утечка таблицы сессий не даёт войти. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
