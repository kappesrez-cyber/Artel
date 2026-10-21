import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentUser, type CurrentUser } from "./session";

export type OrganizationUser = CurrentUser & {
  organization: NonNullable<CurrentUser["organization"]>;
};

/** Для страниц кабинета: пользователь с предприятием, иначе — на вход. */
export async function requireOrganizationUser(next = "/profile"): Promise<OrganizationUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.organization) redirect("/register");
  return user as OrganizationUser;
}

/**
 * Для API записи: может ли текущий пользователь действовать от имени предприятия из адреса.
 * Возвращает пользователя или готовый ответ с ошибкой (401 — не вошёл, 403 — чужое
 * предприятие или выключен нужный режим).
 */
export async function authorizeOrganization(
  organizationId: string,
  { seller = false }: { seller?: boolean } = {},
): Promise<{ user: CurrentUser; denied?: never } | { user?: never; denied: Response }> {
  const user = await getCurrentUser();
  if (!user) {
    return { denied: Response.json({ error: "Войдите в аккаунт" }, { status: 401 }) };
  }
  const membership = await db().membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    select: { organization: { select: { isSeller: true } } },
  });
  if (!membership) {
    return {
      denied: Response.json({ error: "Нет доступа к этому предприятию" }, { status: 403 }),
    };
  }
  if (seller && !membership.organization.isSeller) {
    return {
      denied: Response.json(
        { error: "Включите режим продавца в профиле предприятия" },
        { status: 403 },
      ),
    };
  }
  return { user };
}
