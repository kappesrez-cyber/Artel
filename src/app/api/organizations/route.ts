import { createOrganization } from "@/server/organizations/organizations";
import { errorResponse, readJson } from "@/server/http";
import { checkSellerAccess } from "@/server/seller-access";

/** POST /api/organizations — зарегистрировать производителя. */
export async function POST(request: Request) {
  const denied = checkSellerAccess(request);
  if (denied) return denied;
  try {
    const organization = await createOrganization(await readJson(request));
    return Response.json(organization, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
