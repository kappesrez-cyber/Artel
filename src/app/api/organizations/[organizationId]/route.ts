import { getOrganization, updateOrganization } from "@/server/organizations/organizations";
import { errorResponse, readJson } from "@/server/http";
import { checkSellerAccess } from "@/server/seller-access";

type Context = RouteContext<"/api/organizations/[organizationId]">;

/** GET /api/organizations/{id} — профиль производителя. */
export async function GET(request: Request, ctx: Context) {
  const { organizationId } = await ctx.params;
  const denied = checkSellerAccess(request);
  if (denied) return denied;
  try {
    return Response.json(await getOrganization(organizationId));
  } catch (error) {
    return errorResponse(error);
  }
}

/** PATCH /api/organizations/{id} — изменить профиль производителя. */
export async function PATCH(request: Request, ctx: Context) {
  const { organizationId } = await ctx.params;
  const denied = checkSellerAccess(request);
  if (denied) return denied;
  try {
    return Response.json(await updateOrganization(organizationId, await readJson(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
