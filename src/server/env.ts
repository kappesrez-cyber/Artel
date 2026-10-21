import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  /** Кто принимает оплату звёзд. Пока есть только тестовая заглушка, см. `src/server/stars/payments.ts`. */
  PAYMENT_PROVIDER: z.enum(["stub"]).default("stub"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Некорректные переменные окружения:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Проверенные переменные окружения. Читаются лениво, чтобы сборка не требовала секретов. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
