import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { searchTerms } from "@/server/catalog/search-text";
import { db } from "@/server/db";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { boostOrderInTransaction } from "@/server/stars/stars";
import { orderInputSchema, validateAttachments, type IncomingFile } from "./schemas";

/**
 * Заказы на рынке. Заказчик размещает заказ (что нужно, ТЗ, документы, контакты),
 * предприятия в режиме продавца видят все открытые заказы. Порядок на рынке — по звёздам.
 */

/** Разместить заказ; звёзды из поля `stars` списываются в той же транзакции. */
export async function createOrder(
  customerId: string,
  userId: string,
  input: unknown,
  files: IncomingFile[],
): Promise<{ id: string }> {
  const { stars, unit, ...data } = orderInputSchema.parse(input);
  const attachments = validateAttachments(files);
  const fileData = await Promise.all(
    attachments.map(async ({ kind, file }) => ({
      kind,
      fileName: file.name.slice(0, 255),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: new Uint8Array(await file.arrayBuffer()),
    })),
  );
  return db().$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        ...data,
        unit: unit ?? "шт.",
        customerId,
        createdByUserId: userId,
        attachments: { create: fileData },
      },
      select: { id: true },
    });
    if (stars) {
      await boostOrderInTransaction(tx, customerId, userId, order.id, { stars });
    }
    return order;
  });
}

export type MarketSort = "stars" | "new" | "deadline";

const cardSelect = {
  id: true,
  title: true,
  quantity: true,
  unit: true,
  budget: true,
  deadline: true,
  city: true,
  stars: true,
  status: true,
  createdAt: true,
  customer: { select: { id: true, name: true, city: true } },
  boosts: { select: { organizationId: true, quantity: true } },
} satisfies Prisma.OrderSelect;

type CardRow = Prisma.OrderGetPayload<{ select: typeof cardSelect }>;

/** Заказ в списке: бюджет строкой, общий спрос с учётом присоединившихся предприятий. */
export type OrderCardView = Omit<CardRow, "budget" | "boosts"> & {
  budget: string | null;
  /** Количество заказчика плюс объёмы тех, кто присоединился звёздами. */
  totalQuantity: number | null;
  /** Сколько других предприятий поддержали заказ звёздами. */
  supporters: number;
};

function toCard(row: CardRow): OrderCardView {
  const { boosts, budget, ...rest } = row;
  const others = boosts.filter((b) => b.organizationId !== row.customer.id);
  const joined = others.reduce((sum, b) => sum + (b.quantity ?? 0), 0);
  return {
    ...rest,
    budget: budget?.toFixed(2) ?? null,
    totalQuantity: row.quantity == null && joined === 0 ? null : (row.quantity ?? 0) + joined,
    supporters: new Set(others.map((b) => b.organizationId)).size,
  };
}

const marketOrder: Record<MarketSort, Prisma.OrderOrderByWithRelationInput[]> = {
  stars: [{ stars: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  new: [{ createdAt: "desc" }, { id: "asc" }],
  deadline: [{ deadline: { sort: "asc", nulls: "last" } }, { stars: "desc" }, { id: "asc" }],
};

/** Открытые заказы для режима продавца. По умолчанию выше те, в которые вложено больше звёзд. */
export async function listMarketOrders({
  query = "",
  sort = "stars",
  limit = 60,
}: { query?: string; sort?: MarketSort; limit?: number } = {}): Promise<OrderCardView[]> {
  const terms = searchTerms(query);
  const rows = await db().order.findMany({
    where: {
      status: "OPEN",
      AND: terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { specification: { contains: term, mode: "insensitive" } },
          { city: { contains: term, mode: "insensitive" } },
        ],
      })),
    },
    orderBy: marketOrder[sort],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Заказы предприятия: размещённые им и те, что оно поддержало звёздами. */
export async function listOrganizationOrders(organizationId: string) {
  const [own, supported] = await Promise.all([
    db().order.findMany({
      where: { customerId: organizationId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: cardSelect,
    }),
    db().order.findMany({
      where: {
        customerId: { not: organizationId },
        boosts: { some: { organizationId } },
      },
      orderBy: [{ status: "asc" }, { stars: "desc" }],
      select: cardSelect,
    }),
  ]);
  return { own: own.map(toCard), supported: supported.map(toCard) };
}

const detailSelect = {
  ...cardSelect,
  description: true,
  specification: true,
  contactName: true,
  contactPhone: true,
  contactEmail: true,
  closedAt: true,
  attachments: {
    orderBy: { createdAt: "asc" },
    select: { id: true, kind: true, fileName: true, size: true, mimeType: true },
  },
  boosts: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      organizationId: true,
      stars: true,
      quantity: true,
      comment: true,
      createdAt: true,
      organization: { select: { id: true, name: true, city: true } },
    },
  },
} satisfies Prisma.OrderSelect;

type DetailRow = Prisma.OrderGetPayload<{ select: typeof detailSelect }>;

export type OrderDetailView = OrderCardView &
  Pick<
    DetailRow,
    | "description"
    | "specification"
    | "contactName"
    | "contactPhone"
    | "contactEmail"
    | "closedAt"
    | "attachments"
    | "boosts"
  >;

/** Заказ целиком. Закрытый видит только сам заказчик. */
export async function getOrder(id: string, viewerOrganizationId?: string | null) {
  const row = await db().order.findUnique({ where: { id }, select: detailSelect });
  if (!row) return null;
  if (row.status !== "OPEN" && row.customer.id !== viewerOrganizationId) return null;
  return { ...toCard(row), ...pickDetail(row) } satisfies OrderDetailView;
}

function pickDetail(row: DetailRow) {
  const { description, specification, contactName, contactPhone, contactEmail } = row;
  return {
    description,
    specification,
    contactName,
    contactPhone,
    contactEmail,
    closedAt: row.closedAt,
    attachments: row.attachments,
    boosts: row.boosts,
  };
}

/** Снять заказ с рынка (нашли исполнителя) или вернуть обратно. Только заказчик. */
export async function setOrderOpen(organizationId: string, orderId: string, open: boolean) {
  const { count } = await db().order.updateMany({
    where: { id: orderId, customerId: organizationId },
    data: open ? { status: "OPEN", closedAt: null } : { status: "CLOSED", closedAt: new Date() },
  });
  if (count === 0) throw new NotFoundError("Заказ не найден");
}

/** Файл заказа для скачивания: открытый заказ — любому вошедшему, закрытый — только заказчику. */
export async function getOrderAttachment(
  orderId: string,
  attachmentId: string,
  viewerOrganizationId: string,
) {
  const file = await db().orderAttachment.findFirst({
    where: { id: attachmentId, orderId },
    select: {
      fileName: true,
      mimeType: true,
      data: true,
      order: { select: { status: true, customerId: true } },
    },
  });
  if (!file) throw new NotFoundError("Файл не найден");
  if (file.order.status !== "OPEN" && file.order.customerId !== viewerOrganizationId) {
    throw new ForbiddenError("Заказ снят с рынка");
  }
  return file;
}
