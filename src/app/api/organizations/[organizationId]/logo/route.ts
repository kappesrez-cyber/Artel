import { errorResponse } from "@/server/http";
import { getLogoFile } from "@/server/organizations/logo";

/** Логотип предприятия. Адрес с `?v=` меняется вместе с логотипом, поэтому кешируется надолго. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/organizations/[organizationId]/logo">,
) {
  const { organizationId } = await params;
  try {
    const logo = await getLogoFile(organizationId);
    return new Response(logo.data, {
      headers: {
        "Content-Type": logo.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
