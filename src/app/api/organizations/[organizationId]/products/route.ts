import { createProduct, listOrganizationProducts } from "@/server/catalog/products";
import { errorResponse, readJson } from "@/server/http";
import { checkSellerAccess } from "@/server/seller-access";

type Context = RouteContext<"/api/organizations/[organizationId]/products">;

/** GET /api/organizations/{id}/products — все позиции производителя, включая черновики. */
export async function GET(request: Request, ctx: Context) {
  const { organizationId } = await ctx.params;
  const denied = checkSellerAccess(request);
  if (denied) return denied;
  try {
    return Response.json({ items: await listOrganizationProducts(organizationId) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/organizations/{id}/products — добавить позицию в каталог производителя. */
export async function POST(request: Request, ctx: Context) {
  const { organizationId } = await ctx.params;
  const denied = checkSellerAccess(request);
  if (denied) return denied;
  try {
    const product = await createProduct(organizationId, await readJson(request));
    return Response.json(product, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
