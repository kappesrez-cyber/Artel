import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/errors";
import {
  availableDealActions,
  nextDealStatus,
  type DealAction,
  type DealSide,
} from "./transitions";

/**
 * Сделки и отзывы. Все функции принимают id предприятия, от имени которого действует
 * пользователь; проверка, что пользователь в нём состоит, делается выше (сессия).
 */

export const proposeDealSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, "Количество: от 1").max(1_000_000),
  comment: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(2000).nullish(),
  ),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Оценка от 1 до 5").max(5, "Оценка от 1 до 5"),
  text: z.string().trim().min(1, "Напишите пару слов о сделке").max(3000),
});

/** Покупатель предлагает сделку по опубликованной позиции другого предприятия. */
export async function proposeDeal(buyerId: string, userId: string, input: unknown) {
  const { productId, quantity, comment } = proposeDealSchema.parse(input);
  const [buyer, product] = await Promise.all([
    db().organization.findUnique({ where: { id: buyerId }, select: { isBuyer: true } }),
    db().product.findFirst({
      where: { id: productId, status: "PUBLISHED" },
      select: { id: true, name: true, price: true, organizationId: true },
    }),
  ]);
  if (!buyer) throw new NotFoundError("Организация не найдена");
  if (!buyer.isBuyer) throw new ForbiddenError("Включите режим покупателя в профиле предприятия");
  if (!product) throw new NotFoundError("Позиция не найдена или снята с продажи");
  if (product.organizationId === buyerId) {
    throw new ForbiddenError("Нельзя заключить сделку со своим предприятием");
  }
  return db().deal.create({
    data: {
      sellerId: product.organizationId,
      buyerId,
      productId: product.id,
      title: product.name,
      unitPrice: product.price,
      quantity,
      comment,
      createdByUserId: userId,
    },
    select: { id: true },
  });
}

const dealSelect = {
  id: true,
  title: true,
  quantity: true,
  unitPrice: true,
  comment: true,
  status: true,
  productId: true,
  createdAt: true,
  acceptedAt: true,
  completedAt: true,
  cancelledAt: true,
  seller: { select: { id: true, name: true } },
  buyer: { select: { id: true, name: true } },
  reviews: { select: { authorOrganizationId: true, rating: true } },
} satisfies Prisma.DealSelect;

type DealRow = Prisma.DealGetPayload<{ select: typeof dealSelect }>;

/** Сделка глазами одной из сторон: кто контрагент, что можно сделать, оставлен ли отзыв. */
export type DealView = Omit<DealRow, "unitPrice" | "reviews"> & {
  side: DealSide;
  counterpart: { id: string; name: string };
  unitPrice: string | null;
  actions: DealAction[];
  /** Можно оставить отзыв: сделка успешна, а своего отзыва ещё нет. */
  canReview: boolean;
};

function toView(row: DealRow, organizationId: string): DealView {
  const side: DealSide = row.seller.id === organizationId ? "seller" : "buyer";
  const { reviews, unitPrice, ...rest } = row;
  return {
    ...rest,
    side,
    counterpart: side === "seller" ? row.buyer : row.seller,
    unitPrice: unitPrice?.toFixed(2) ?? null,
    actions: availableDealActions(row.status, side),
    canReview:
      row.status === "COMPLETED" && !reviews.some((r) => r.authorOrganizationId === organizationId),
  };
}

/** Все сделки предприятия: где оно продаёт и где покупает, новые сверху. */
export async function listDeals(organizationId: string): Promise<DealView[]> {
  const rows = await db().deal.findMany({
    where: { OR: [{ sellerId: organizationId }, { buyerId: organizationId }] },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: dealSelect,
  });
  return rows.map((row) => toView(row, organizationId));
}

async function findOwnDeal(organizationId: string, dealId: string) {
  const deal = await db().deal.findFirst({
    where: { id: dealId, OR: [{ sellerId: organizationId }, { buyerId: organizationId }] },
    select: { id: true, status: true, sellerId: true, buyerId: true },
  });
  if (!deal) throw new NotFoundError("Сделка не найдена");
  return deal;
}

const timestampFor = {
  ACCEPTED: "acceptedAt",
  COMPLETED: "completedAt",
  CANCELLED: "cancelledAt",
} as const;

/** Принять, завершить или отменить сделку. */
export async function changeDealStatus(organizationId: string, dealId: string, action: DealAction) {
  const deal = await findOwnDeal(organizationId, dealId);
  const side: DealSide = deal.sellerId === organizationId ? "seller" : "buyer";
  const status = nextDealStatus(deal.status, side, action);
  if (!status || status === "REQUESTED") {
    throw new ConflictError("Это действие сейчас недоступно");
  }
  // Условие на прежний статус защищает от двух одновременных нажатий.
  const { count } = await db().deal.updateMany({
    where: { id: deal.id, status: deal.status },
    data: { status, [timestampFor[status]]: new Date() },
  });
  if (count === 0) throw new ConflictError("Сделка уже изменилась, обновите страницу");
}

/** Отзыв о контрагенте по завершённой сделке. Один от каждой стороны. */
export async function leaveReview(organizationId: string, dealId: string, input: unknown) {
  const data = reviewSchema.parse(input);
  const deal = await findOwnDeal(organizationId, dealId);
  if (deal.status !== "COMPLETED") {
    throw new ConflictError("Отзыв можно оставить только по завершённой сделке");
  }
  const targetOrganizationId = deal.sellerId === organizationId ? deal.buyerId : deal.sellerId;
  try {
    return await db().review.create({
      data: { ...data, dealId, authorOrganizationId: organizationId, targetOrganizationId },
      select: { id: true },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      throw new ConflictError("Вы уже оставили отзыв по этой сделке");
    }
    throw error;
  }
}

/** Отзывы о предприятии и отзывы, которые оно написало. */
export async function listReviews(organizationId: string) {
  const select = {
    id: true,
    rating: true,
    text: true,
    createdAt: true,
    deal: { select: { title: true } },
    authorOrganization: { select: { id: true, name: true } },
    targetOrganization: { select: { id: true, name: true } },
  } satisfies Prisma.ReviewSelect;
  const [received, written] = await Promise.all([
    db().review.findMany({
      where: { targetOrganizationId: organizationId },
      orderBy: { createdAt: "desc" },
      select,
    }),
    db().review.findMany({
      where: { authorOrganizationId: organizationId },
      orderBy: { createdAt: "desc" },
      select,
    }),
  ]);
  return { received, written };
}
