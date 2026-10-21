import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/server/db";
import { SESSION_COOKIE } from "./cookie";
import { hashSessionToken, newSessionToken } from "./tokens";

const SESSION_DAYS = 30;

/** Кто сейчас на сайте и от имени какого предприятия. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** Предприятие пользователя. Сотрудник нескольких предприятий пока работает от первого. */
  organization: {
    id: string;
    name: string;
    isSeller: boolean;
    isBuyer: boolean;
    role: "OWNER" | "MEMBER";
  } | null;
};

/** Начать сессию: запись в базе и httpOnly cookie. Только в Server Action или Route Handler. */
export async function startSession(userId: string): Promise<void> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db().session.create({
    data: { userId, tokenHash: hashSessionToken(token), expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Выйти: удалить сессию из базы и cookie. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db().session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Текущий пользователь по cookie сессии или `null`. Читает запрос, поэтому на страницах
 * вызывается внутри `<Suspense>`. В пределах одного запроса база опрашивается один раз.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          memberships: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: {
              role: true,
              organization: { select: { id: true, name: true, isSeller: true, isBuyer: true } },
            },
          },
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const { memberships, ...user } = session.user;
  const membership = memberships[0];
  return {
    ...user,
    organization: membership ? { ...membership.organization, role: membership.role } : null,
  };
});

async function readSessionToken(): Promise<string | undefined> {
  try {
    return (await cookies()).get(SESSION_COOKIE)?.value;
  } catch (error) {
    // `next dev` 16.4 иногда бросает InvariantError из cookies() при рендере сразу после
    // Server Action (в продакшен-сборке этой проверки нет). Тогда читаем заголовок напрямую.
    if (
      process.env.NODE_ENV === "development" &&
      error instanceof Error &&
      error.message.includes("underlying cookies object")
    ) {
      const header = (await headers()).get("cookie") ?? "";
      const pair = header.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
      return pair?.slice(SESSION_COOKIE.length + 1);
    }
    throw error;
  }
}
