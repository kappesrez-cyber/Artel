import { endSession } from "@/server/auth/session";

/** POST /api/auth/logout — завершить текущую сессию. */
export async function POST() {
  await endSession();
  return new Response(null, { status: 204 });
}
