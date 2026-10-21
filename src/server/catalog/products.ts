import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { photoOrder } from "@/server/photos/photos";
import { productInputSchema, productUpdateSchema } from "./schemas";
import { rankProducts, type SearchMode } from "./search";
import { buildSearchText } from "./search-text";

/**
 * Слой данных каталога. Всё чтение и запись позиций идёт через эти функции:
 * страница поиска, API продавца и сид. Так правила (поиск только по опубликованным,
 * пересчёт `searchText`, проверка принадлежности организации) живут в одном месте.
 */

const productSelect = {
  id: true,
  name: true,
  description: true,
  article: true,
  analogs: true,
  price: true,
  leadTimeDays: true,
  city: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  organization: {
    select: {
      id: true,
      name: true,
      logo: { select: { updatedAt: true } },
      /** Итог ИИ-сводки для плашки в карточке. */
      assessment: { select: { verdict: true, tone: true } },
    },
  },
  /** Только адреса снимков (`/api/photos/{id}`), сами файлы отдаются отдельно. */
  photos: { select: { id: true }, orderBy: photoOrder },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

/** Позиция в том виде, в каком её отдают страницы и API. Цена — строка, чтобы не терять копейки. */
export type ProductView = Omit<ProductRow, "price"> & { price: string; currency: "RUB" };

function toView(row: ProductRow): ProductView {
  return { ...row, price: row.price.toFixed(2), currency: "RUB" };
}

export type ProductSearchResult = {
  items: ProductView[];
  mode: SearchMode;
  /** Синонимы, которые добавились к словам запроса: «сальник» → «манжета»… */
  synonyms: string[];
  /** Исправленные опечатки: «подшибник» → ["подшипник"]. */
  corrections: Record<string, string[]>;
};

/** Поиск покупателя по опубликованным позициям. Алгоритм и порядок — в `search.ts`. */
export async function searchProducts(query: string, limit = 48): Promise<ProductSearchResult> {
  const { mode, ids, parsed, corrections } = await rankProducts(query, limit);
  const rows = await db().product.findMany({
    where: { id: { in: ids } },
    select: productSelect,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return {
    mode,
    items: ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [toView(row)] : [];
    }),
    synonyms: [...new Set(parsed.terms.flatMap((t) => t.synonyms))],
    corrections,
  };
}

/** Карточка для покупателя: только опубликованная позиция. */
export async function getPublishedProduct(id: string): Promise<ProductView | null> {
  const row = await db().product.findFirst({
    where: { id, status: "PUBLISHED" },
    select: productSelect,
  });
  return row && toView(row);
}

/** Опубликованные позиции предприятия — для его публичной страницы. */
export async function listPublishedOrganizationProducts(
  organizationId: string,
): Promise<ProductView[]> {
  const rows = await db().product.findMany({
    where: { organizationId, status: "PUBLISHED" },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: productSelect,
  });
  return rows.map(toView);
}

/** Все позиции организации, включая черновики и архив, — для режима продавца. */
export async function listOrganizationProducts(organizationId: string): Promise<ProductView[]> {
  await requireOrganization(organizationId);
  const rows = await db().product.findMany({
    where: { organizationId },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: productSelect,
  });
  return rows.map(toView);
}

export async function getOrganizationProduct(
  organizationId: string,
  productId: string,
): Promise<ProductView> {
  const row = await db().product.findFirst({
    where: { id: productId, organizationId },
    select: productSelect,
  });
  if (!row) throw new NotFoundError("Позиция не найдена");
  return toView(row);
}

export async function createProduct(
  organizationId: string,
  /** Сырые данные (тело запроса API); проверяются `productInputSchema`. */
  input: unknown,
): Promise<ProductView> {
  const data = productInputSchema.parse(input);
  const organization = await requireOrganization(organizationId);
  const row = await db().product.create({
    data: {
      ...data,
      organizationId,
      searchText: buildSearchText({ ...data, organizationName: organization.name }),
    },
    select: productSelect,
  });
  return toView(row);
}

export async function updateProduct(
  organizationId: string,
  productId: string,
  /** Сырые данные; проверяются `productUpdateSchema`. */
  input: unknown,
): Promise<ProductView> {
  const data = productUpdateSchema.parse(input);
  const current = await getOrganizationProduct(organizationId, productId);
  const row = await db().product.update({
    where: { id: productId },
    data: {
      ...data,
      searchText: buildSearchText({
        name: data.name ?? current.name,
        article: data.article === undefined ? current.article : data.article,
        analogs: data.analogs === undefined ? current.analogs : data.analogs,
        description: data.description === undefined ? current.description : data.description,
        city: data.city ?? current.city,
        organizationName: current.organization.name,
      }),
    },
    select: productSelect,
  });
  return toView(row);
}

/** Пересчитать текст поиска у всех позиций организации (например, после смены её названия). */
export async function reindexOrganizationProducts(organizationId: string): Promise<void> {
  const products = await db().product.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      article: true,
      analogs: true,
      description: true,
      city: true,
      organization: { select: { name: true } },
    },
  });
  await db().$transaction(
    products.map((p) =>
      db().product.update({
        where: { id: p.id },
        data: { searchText: buildSearchText({ ...p, organizationName: p.organization.name }) },
      }),
    ),
  );
}

async function requireOrganization(id: string) {
  const organization = await db().organization.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!organization) throw new NotFoundError("Организация не найдена");
  return organization;
}
