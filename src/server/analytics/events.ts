import "server-only";
import { normalize } from "@/server/catalog/search-text";
import { db } from "@/server/db";

/**
 * Сбор событий для аналитики: запросы в поиске, показы позиций в выдаче и просмотры карточек.
 * Вызывается из `after()`, после ответа страницы. Ошибка записи не должна ломать сайт,
 * поэтому здесь она только пишется в лог. Свои позиции предприятию не засчитываются.
 */

type Shown = { id: string; organization: { id: string } };

/** Запрос в поиске и показ найденных позиций. */
export async function recordSearch(
  query: string,
  items: Shown[],
  viewerOrganizationId: string | null,
): Promise<void> {
  const normalized = normalize(query);
  if (!normalized) return;
  try {
    const search = await db().searchQuery.create({
      data: {
        query: query.slice(0, 200),
        normalized: normalized.slice(0, 200),
        resultsCount: items.length,
        viewerOrganizationId,
      },
      select: { id: true },
    });
    const shown = items.filter((p) => p.organization.id !== viewerOrganizationId);
    if (shown.length > 0) {
      await db().productEvent.createMany({
        data: shown.map((p) => ({
          productId: p.id,
          kind: "IMPRESSION" as const,
          viewerOrganizationId,
          searchQueryId: search.id,
        })),
      });
    }
  } catch (error) {
    console.error("Аналитика: не удалось записать поиск", error);
  }
}

/** Покупатель открыл карточку позиции. */
export async function recordProductView(
  product: Shown,
  viewerOrganizationId: string | null,
): Promise<void> {
  if (product.organization.id === viewerOrganizationId) return;
  try {
    await db().productEvent.create({
      data: { productId: product.id, kind: "VIEW", viewerOrganizationId },
    });
  } catch (error) {
    console.error("Аналитика: не удалось записать просмотр", error);
  }
}
