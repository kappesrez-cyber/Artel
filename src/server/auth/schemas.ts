import "server-only";
import { z } from "zod";
import { organizationInputSchema } from "@/server/organizations/schemas";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Проверьте email"))
  .pipe(z.string().max(200));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Введите пароль").max(200),
});

/** Регистрация: человек и его предприятие одной формой. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Как к вам обращаться?").max(200),
  email,
  password: z.string().min(8, "Пароль: не короче 8 символов").max(200),
  organization: organizationInputSchema.pick({ name: true, inn: true, city: true }).extend({
    isSeller: z.boolean(),
    isBuyer: z.boolean(),
  }),
});

export type RegisterInput = z.input<typeof registerSchema>;
