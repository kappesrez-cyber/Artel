import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { assess, type AssessmentPoint, type CompanyFacts, type ExternalChecks } from "./assess";

/** Факты о предприятии из базы платформы: документы, сделки, отзывы, каталог. */
async function gatherFacts(organizationId: string): Promise<CompanyFacts> {
  const org = await db().organization.findUnique({
    where: { id: organizationId },
    select: {
      isSeller: true,
      foundedYear: true,
      verifiedAt: true,
      documents: { select: { kind: true, issuedAt: true, title: true } },
    },
  });
  if (!org) throw new NotFoundError("Организация не найдена");
  const party = { OR: [{ sellerId: organizationId }, { buyerId: organizationId }] };
  const [deals, reviews, products, productsWithAnalogs] = await Promise.all([
    db().deal.groupBy({ by: ["status"], where: party, _count: true }),
    db().review.aggregate({
      where: { targetOrganizationId: organizationId },
      _count: true,
      _avg: { rating: true },
    }),
    db().product.count({ where: { organizationId, status: "PUBLISHED" } }),
    db().product.count({
      where: { organizationId, status: "PUBLISHED", analogs: { not: null } },
    }),
  ]);
  const count = (status: string) => deals.find((d) => d.status === status)?._count ?? 0;
  // Год отчёта — из названия («…за 2024 год»), иначе год до даты сдачи.
  const financialYears = org.documents
    .filter((d) => d.kind === "FINANCIAL_REPORT")
    .flatMap((d) => {
      const year = /\b(20\d\d)\b/.exec(d.title)?.[1];
      if (year) return [Number(year)];
      return d.issuedAt ? [d.issuedAt.getFullYear() - 1] : [];
    });
  const avg = reviews._avg.rating;
  return {
    isSeller: org.isSeller,
    foundedYear: org.foundedYear,
    verified: org.verifiedAt !== null,
    financialYears,
    certificates: org.documents.filter((d) =>
      ["CERTIFICATE", "QUALITY", "LICENSE"].includes(d.kind),
    ).length,
    completedDeals: count("COMPLETED"),
    cancelledDeals: count("CANCELLED"),
    totalDeals: deals.reduce((sum, d) => sum + d._count, 0),
    reviewsCount: reviews._count,
    averageRating: avg === null ? null : Math.round(avg * 10) / 10,
    products,
    productsWithAnalogs,
  };
}

/**
 * Пересобрать сводку. Внешние проверки (`external`) берутся новые, если переданы,
 * иначе остаются прежние: их не пересчитать из данных платформы.
 */
export async function refreshAssessment(organizationId: string, external?: ExternalChecks) {
  const stored = external
    ? undefined
    : await db().companyAssessment.findUnique({
        where: { organizationId },
        select: { external: true },
      });
  const checks = external ?? ((stored?.external ?? {}) as ExternalChecks);
  const result = assess(await gatherFacts(organizationId), checks);
  const data = {
    ...result,
    points: result.points as unknown as Prisma.InputJsonValue,
    external: checks as Prisma.InputJsonValue,
    generatedAt: new Date(),
  };
  const saved = await db().companyAssessment.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  });
  return toView(saved);
}

type Row = Awaited<ReturnType<ReturnType<typeof db>["companyAssessment"]["upsert"]>>;

function toView(row: Row) {
  return {
    verdict: row.verdict,
    tone: row.tone,
    score: row.score,
    summary: row.summary,
    points: row.points as unknown as AssessmentPoint[],
    generatedAt: row.generatedAt,
  };
}

export type AssessmentView = ReturnType<typeof toView>;

/** Сводка для страницы предприятия. Если её ещё нет — собирается при первом показе. */
export async function getAssessment(organizationId: string): Promise<AssessmentView> {
  const row = await db().companyAssessment.findUnique({ where: { organizationId } });
  return row ? toView(row) : refreshAssessment(organizationId);
}

/** Все производители с итогом ИИ-сводки — для страницы «Производители». Лучшие сверху. */
export async function listAssessedSellers() {
  const select = {
    id: true,
    name: true,
    city: true,
    description: true,
    logo: { select: { updatedAt: true } },
    assessment: true,
    _count: { select: { products: { where: { status: "PUBLISHED" as const } } } },
  };
  let sellers = await db().organization.findMany({ where: { isSeller: true }, select });
  const missing = sellers.filter((s) => !s.assessment);
  if (missing.length > 0) {
    for (const s of missing) await refreshAssessment(s.id);
    sellers = await db().organization.findMany({ where: { isSeller: true }, select });
  }
  return sellers
    .flatMap(({ assessment, _count, ...s }) =>
      assessment ? [{ ...s, products: _count.products, assessment: toView(assessment) }] : [],
    )
    .sort((a, b) => b.assessment.score - a.assessment.score);
}
