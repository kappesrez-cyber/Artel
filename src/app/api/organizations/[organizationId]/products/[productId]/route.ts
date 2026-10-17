import { getOrganizationProduct, updateProduct } from "@/server/catalog/products";
import { errorResponse, readJson } from "@/server/http";
import { authorizeOrganization } from "@/server/auth/access";

type Context = RouteContext<"/api/organizations/[organizationId]/products/[productId]">;

/** GET /api/organizations/{id}/products/{productId} — позиция в любом статусе. */
export async function GET(_request: Request, ctx: Context) {
  const { organizationId, productId } = await ctx.params;
  const { denied } = await authorizeOrganization(organizationId);
  if (denied) return denied;
  try {
    return Response.json(await getOrganizationProduct(organizationId, productId));
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PATCH /api/organizations/{id}/products/{productId} — изменить поля позиции.
 * Публикация и снятие с продажи — это смена `status` на PUBLISHED или ARCHIVED.
 */
export async function PATCH(request: Request, ctx: Context) {
  const { organizationId, productId } = await ctx.params;
  const { denied } = await authorizeOrganization(organizationId, { seller: true });
  if (denied) return denied;
  try {
    const product = await updateProduct(organizationId, productId, await readJson(request));
    return Response.json(product);
  } catch (error) {
    return errorResponse(error);
  }
}
