import "server-only";
import { z } from "zod";
import { NotFoundError } from "./errors";

/** Тело запроса как JSON; при битом JSON — `undefined`, и дальше сработает валидация. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Единый ответ API на ошибки слоя данных. */
export function errorResponse(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: "Некорректные данные", details: z.flattenError(error) },
      { status: 400 },
    );
  }
  if (error instanceof NotFoundError) {
    return Response.json({ error: error.message }, { status: 404 });
  }
  if (isUniqueViolation(error)) {
    return Response.json({ error: "Такая запись уже есть" }, { status: 409 });
  }
  console.error("API: необработанная ошибка", error);
  return Response.json({ error: "Внутренняя ошибка" }, { status: 500 });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
