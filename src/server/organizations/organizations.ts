import "server-only";
import { reindexOrganizationProducts } from "@/server/catalog/products";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { organizationInputSchema, organizationUpdateSchema } from "./schemas";

const organizationSelect = {
  id: true,
  name: true,
  inn: true,
  city: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createOrganization(input: unknown) {
  const data = organizationInputSchema.parse(input);
  return db().organization.create({ data, select: organizationSelect });
}

export async function getOrganization(id: string) {
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
