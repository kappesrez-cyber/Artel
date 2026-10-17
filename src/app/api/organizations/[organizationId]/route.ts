import { authorizeOrganization } from "@/server/auth/access";
import { errorResponse, readJson } from "@/server/http";
import {
  getOrganizationStats,
  getOrganization,
  updateOrganization,
} from "@/server/organizations/organizations";

type Context = RouteContext<"/api/organizations/[organizationId]">;

/** GET /api/organizations/{id} — публичный профиль предприятия с репутацией. */
export async function GET(_request: Request, ctx: Context) {
  const { organizationId } = await ctx.params;
  try {
    const [organization, stats] = await Promise.all([
      getOrganization(organizationId),
      getOrganizationStats(organizationId),
    ]);
    return Response.json({ ...organization, stats });
  } catch (error) {
    return errorResponse(error);
  }
}

/** PATCH /api/organizations/{id} — изменить профиль. Только сотрудники предприятия. */
export async function PATCH(request: Request, ctx: Context) {
  const { organizationId } = await ctx.params;
  const { denied } = await authorizeOrganization(organizationId);
  if (denied) return denied;
  try {
    return Response.json(await updateOrganization(organizationId, await readJson(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
