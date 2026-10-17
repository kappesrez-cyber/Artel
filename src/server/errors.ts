import "server-only";

/** Запрошенная запись не существует (или не принадлежит организации). API отвечает 404. */
export class NotFoundError extends Error {
  readonly name = "NotFoundError";
}
