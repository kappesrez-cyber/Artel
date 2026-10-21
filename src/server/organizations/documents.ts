import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";

export const documentKinds = [
  "REGISTRATION",
  "CERTIFICATE",
  "LICENSE",
  "FINANCIAL_REPORT",
  "QUALITY",
  "OTHER",
] as const;

export type DocumentKind = (typeof documentKinds)[number];

const empty = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const date = z.preprocess(empty, z.coerce.date({ error: "Проверьте дату" }).nullish());

export const documentInputSchema = z.object({
  kind: z.enum(documentKinds).default("OTHER"),
  title: z.string().trim().min(1, "Укажите название документа").max(300),
  number: z.preprocess(empty, z.string().trim().max(100).nullish()),
  issuedAt: date,
  validUntil: date,
  url: z.preprocess(
    empty,
    z
      .url({ protocol: /^https?$/, error: "Ссылка должна начинаться с https://" })
      .max(1000)
      .nullish(),
  ),
  isPublic: z.boolean().default(true),
});

const documentSelect = {
  id: true,
  kind: true,
  title: true,
  number: true,
  issuedAt: true,
  validUntil: true,
  url: true,
  isPublic: true,
  createdAt: true,
} as const;

/** Все документы предприятия, включая скрытые, — для личного кабинета. */
export async function listDocuments(organizationId: string) {
  return db().organizationDocument.findMany({
    where: { organizationId },
    orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
    select: documentSelect,
  });
}

export async function addDocument(organizationId: string, input: unknown) {
  const data = documentInputSchema.parse(input);
  return db().organizationDocument.create({
    data: { ...data, organizationId },
    select: documentSelect,
  });
}

export async function setDocumentVisibility(
  organizationId: string,
  documentId: string,
  isPublic: boolean,
) {
  const { count } = await db().organizationDocument.updateMany({
    where: { id: documentId, organizationId },
    data: { isPublic },
  });
  if (count === 0) throw new NotFoundError("Документ не найден");
}

export async function deleteDocument(organizationId: string, documentId: string) {
  const { count } = await db().organizationDocument.deleteMany({
    where: { id: documentId, organizationId },
  });
  if (count === 0) throw new NotFoundError("Документ не найден");
}
