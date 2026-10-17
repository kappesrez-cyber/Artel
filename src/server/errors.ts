import "server-only";

/** Запрошенная запись не существует (или не принадлежит организации). API отвечает 404. */
export class NotFoundError extends Error {
  readonly name = "NotFoundError";
}

/** Действие запрещено этому предприятию (чужая сделка, выключен режим). API отвечает 403. */
export class ForbiddenError extends Error {
  readonly name = "ForbiddenError";
}

/** Действие не подходит к текущему состоянию записи (сделка уже закрыта). API отвечает 409. */
export class ConflictError extends Error {
  readonly name = "ConflictError";
}
