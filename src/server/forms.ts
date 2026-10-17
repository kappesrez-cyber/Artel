import "server-only";
import { z } from "zod";
import type { FormState } from "@/components/form-state";

/** Ошибки, текст которых можно показать пользователю как есть (см. `errors.ts`, `AccountError`). */
const userFacingErrors = new Set([
  "AccountError",
  "ForbiddenError",
  "ConflictError",
  "NotFoundError",
]);

/** Чекбокс формы: отмечен — "on", не отмечен — поля нет. */
export const checkbox = (form: FormData, name: string) => form.get(name) === "on";

/** Куда вернуть пользователя: только относительный адрес этого сайта, иначе `fallback`. */
export function safeNext(value: unknown, fallback: string): string {
  const next = typeof value === "string" ? value : "";
  // «//host» и «/\\host» браузер понимает как другой сайт.
  return /^\/(?![/\\])/.test(next) ? next : fallback;
}

/** Поля формы объектом: без служебных полей Server Actions и без пароля (его не возвращаем). */
export function formFields(form: FormData): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of form) {
    if (!key.startsWith("$ACTION") && key !== "password" && typeof value === "string") {
      fields[key] = value;
    }
  }
  return fields;
}

/** Ошибку слоя данных — в состояние формы, понятное пользователю. */
export function toFormState(error: unknown): FormState {
  if (error instanceof z.ZodError) {
    // Вложенные поля называются через точку: `organization.name`.
    const fieldErrors: Record<string, string[]> = {};
    let formError: string | undefined;
    for (const issue of error.issues) {
      const key = issue.path.join(".");
      if (key) (fieldErrors[key] ??= []).push(issue.message);
      else formError ??= issue.message;
    }
    return { error: formError ?? "Проверьте поля формы", fieldErrors };
  }
  // По имени, а не instanceof: так проверка не ломается, если dev-сервер подхватил
  // устаревшую копию модуля с классами ошибок.
  if (error instanceof Error && userFacingErrors.has(error.name)) {
    return { error: error.message };
  }
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return { error: "Такая запись уже есть (например, этот ИНН уже занят)" };
  }
  console.error("Форма: необработанная ошибка", error);
  // P2021/P2022 — в базе нет таблицы или колонки: не применены миграции.
  if (
    process.env.NODE_ENV === "development" &&
    typeof error === "object" &&
    error &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022")
  ) {
    return {
      error: "База данных не обновлена: выполните npm run db:deploy и перезапустите сервер",
    };
  }
  return { error: "Что-то пошло не так. Попробуйте ещё раз" };
}
