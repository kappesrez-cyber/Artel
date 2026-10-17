import "server-only";
import { z } from "zod";
import type { FormState } from "@/components/form-state";
import { AccountError } from "./auth/accounts";
import { ConflictError, ForbiddenError, NotFoundError } from "./errors";

/** Чекбокс формы: отмечен — "on", не отмечен — поля нет. */
export const checkbox = (form: FormData, name: string) => form.get(name) === "on";

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
  if (
    error instanceof AccountError ||
    error instanceof ForbiddenError ||
    error instanceof ConflictError ||
    error instanceof NotFoundError
  ) {
    return { error: error.message };
  }
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return { error: "Такая запись уже есть (например, этот ИНН уже занят)" };
  }
  console.error("Форма: необработанная ошибка", error);
  return { error: "Что-то пошло не так. Попробуйте ещё раз" };
}
