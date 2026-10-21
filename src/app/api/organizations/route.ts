import { getCurrentUser } from "@/server/auth/session";
import { errorResponse, readJson } from "@/server/http";
import { createOrganization } from "@/server/organizations/organizations";

/** POST /api/organizations — создать ещё одно предприятие; вошедший пользователь станет владельцем. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Войдите в аккаунт" }, { status: 401 });
  try {
    const organization = await createOrganization(await readJson(request), user.id);
    return Response.json(organization, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
