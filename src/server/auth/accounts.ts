import "server-only";
import { db } from "@/server/db";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "./password";
import { loginSchema, registerSchema } from "./schemas";

/** Ошибка, которую можно показать пользователю как есть. */
export class AccountError extends Error {
  readonly name = "AccountError";
}

/** Создать пользователя, его предприятие и сделать его владельцем. Возвращает id пользователя. */
export async function registerAccount(input: unknown): Promise<string> {
  const { organization, password, ...user } = registerSchema.parse(input);
  if (!organization.isSeller && !organization.isBuyer) {
    throw new AccountError("Отметьте, продаёте вы, покупаете или и то и другое");
  }
  if (await db().user.findUnique({ where: { email: user.email }, select: { id: true } })) {
    throw new AccountError("Этот email уже зарегистрирован. Войдите или используйте другой");
  }
  if (
    organization.inn &&
    (await db().organization.findUnique({ where: { inn: organization.inn }, select: { id: true } }))
  ) {
    throw new AccountError("Предприятие с таким ИНН уже зарегистрировано");
  }
  const passwordHash = await hashPassword(password);
  const created = await db().user.create({
    data: {
      ...user,
      passwordHash,
      memberships: { create: { role: "OWNER", organization: { create: organization } } },
    },
    select: { id: true },
  });
  return created.id;
}

/** Проверить email и пароль. Возвращает id пользователя или `null`. */
export async function authenticate(input: unknown): Promise<string | null> {
  const { email, password } = loginSchema.parse(input);
  const user = await db().user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  // Хэш считается и для несуществующего email, чтобы по времени ответа нельзя было
  // узнать, зарегистрирован ли адрес.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  return ok && user ? user.id : null;
}
