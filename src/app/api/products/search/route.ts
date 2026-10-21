import { connection, type NextRequest } from "next/server";
import { searchProducts } from "@/server/catalog/products";
import { searchQuerySchema } from "@/server/catalog/schemas";
import { errorResponse } from "@/server/http";

/** GET /api/products/search?q=деталь — поиск покупателя по опубликованным позициям. */
export async function GET(request: NextRequest) {
  // Ответ всегда собирается на запрос; без этого Next.js пытается пререндерить маршрут при сборке.
  await connection();
  try {
    const { q, limit } = searchQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const { items, mode, synonyms } = await searchProducts(q, limit);
    return Response.json({ query: q, mode, synonyms, items });
  } catch (error) {
    return errorResponse(error);
  }
}
