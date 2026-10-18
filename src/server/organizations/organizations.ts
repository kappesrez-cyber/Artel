import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { reindexOrganizationProducts } from "@/server/catalog/products";
import { db } from "@/server/db";
import { effectiveTier, getPlan } from "@/server/plans/plans";
import { NotFoundError } from "@/server/errors";
import { organizationInputSchema, organizationUpdateSchema } from "./schemas";

const organizationSelect = {
  id: true,
  name: true,
  inn: true,
  ogrn: true,
  city: true,
  legalAddress: true,
  description: true,
  website: true,
  phone: true,
  email: true,
  foundedYear: true,
  isSeller: true,
  isBuyer: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

export type OrganizationView = Prisma.OrganizationGetPayload<{
  select: typeof organizationSelect;
}>;

/**
 * Создать предприятие. Если передан `ownerUserId`, пользователь становится его владельцем
 * (так работает `POST /api/organizations`; при регистрации предприятие создаётся вместе с
 * пользователем в `registerAccount`).
 */
export async function createOrganization(input: unknown, ownerUserId?: string) {
  const data = organizationInputSchema.parse(input);
  return db().organization.create({
    data: {
      ...data,
      ...(ownerUserId && { memberships: { create: { userId: ownerUserId, role: "OWNER" } } }),
    },
    select: organizationSelect,
  });
}

export async function getOrganization(id: string): Promise<OrganizationView> {
  const organization = await db().organization.findUnique({
    where: { id },
    select: organizationSelect,
  });
  if (!organization) throw new NotFoundError("Организация не найдена");
  return organization;
}

export async function updateOrganization(id: string, input: unknown) {
  const data = organizationUpdateSchema.parse(input);
  const before = await getOrganization(id);
  const organization = await db().organization.update({
    where: { id },
    data,
    select: organizationSelect,
  });
  // Название производителя участвует в поиске его позиций.
  if (organization.name !== before.name) await reindexOrganizationProducts(id);
  return organization;
}

/** Репутация предприятия: успешные сделки (с любой стороны) и отзывы о нём. */
export type OrganizationStats = {
  successfulDeals: number;
  reviewsCount: number;
  /** Средняя оценка с одним знаком после запятой; `null`, пока отзывов нет. */
  averageRating: number | null;
};

export async function getOrganizationStats(id: string): Promise<OrganizationStats> {
  const [successfulDeals, reviews] = await Promise.all([
    db().deal.count({
      where: { status: "COMPLETED", OR: [{ sellerId: id }, { buyerId: id }] },
    }),
    db().review.aggregate({
      where: { targetOrganizationId: id },
      _count: true,
      _avg: { rating: true },
    }),
  ]);
  const avg = reviews._avg.rating;
  return {
    successfulDeals,
    reviewsCount: reviews._count,
    averageRating: avg === null ? null : Math.round(avg * 10) / 10,
  };
}

/** Публичная страница предприятия: профиль, репутация, открытые документы и отзывы. */
export async function getPublicProfile(id: string) {
  const organization = await db().organization.findUnique({
    where: { id },
    select: {
      ...organizationSelect,
      plan: true,
      planUntil: true,
      documents: {
        where: { isPublic: true },
        orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          kind: true,
          title: true,
          number: true,
          issuedAt: true,
          validUntil: true,
          url: true,
        },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          authorOrganization: { select: { id: true, name: true } },
          deal: { select: { title: true } },
        },
      },
    },
  });
  if (!organization) return null;
  const stats = await getOrganizationStats(id);
  const { plan, planUntil, ...rest } = organization;
  // Наружу только действующий тариф, без даты окончания.
  return { ...rest, plan: getPlan(effectiveTier({ plan, planUntil })), stats };
}
