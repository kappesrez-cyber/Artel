import { getCurrentUser } from "@/server/auth/session";

/** GET /api/auth/me — кто вошёл и от имени какого предприятия; `401`, если никто. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Не выполнен вход" }, { status: 401 });
  return Response.json(user);
}
