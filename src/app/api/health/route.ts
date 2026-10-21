import { connection } from "next/server";
import { db } from "@/server/db";

/** Проверка живости приложения и доступности БД (для Docker, мониторинга и CI). */
export async function GET() {
  await connection();

  try {
    await db().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok" });
  } catch (error) {
    console.error("Health check: база данных недоступна", error);
    return Response.json({ status: "error", db: "unavailable" }, { status: 503 });
  }
}
