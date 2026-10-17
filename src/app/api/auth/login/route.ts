import { authenticate } from "@/server/auth/accounts";
import { startSession } from "@/server/auth/session";
import { errorResponse, readJson } from "@/server/http";

/**
 * POST /api/auth/login `{ email, password }` — вход для скриптов и интеграций.
 * Ставит ту же cookie сессии, что и форма входа на сайте.
 */
export async function POST(request: Request) {
  try {
    const userId = await authenticate(await readJson(request));
    if (!userId) return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
    await startSession(userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
