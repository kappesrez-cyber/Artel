import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { readPhotos } from "@/server/photos/schemas";
import { isPhotoAngle, MAX_SEARCH_PHOTOS } from "./angles";
import { profiles } from "./profiles";
import { recognize, type Recognition } from "./recognize";

export type PhotoSearchInput = {
  files: File[];
  /** Ракурс и отпечаток каждого снимка, в том же порядке, что `files`. */
  angles: string[];
  fingerprints: string[];
  hint?: string | null;
};

/**
 * Поиск по фото: проверить снимки, распознать деталь и сохранить поиск, чтобы результат
 * открывался по своему адресу. Возвращает id поиска.
 */
export async function createPhotoSearch(
  viewerOrganizationId: string | null,
  input: PhotoSearchInput,
): Promise<string> {
  const files = input.files.filter((f) => f.size > 0).slice(0, MAX_SEARCH_PHOTOS);
  const photos = await readPhotos(files);
  const meta = photos.map((_, i) => ({
    angle: isPhotoAngle(input.angles[i]) ? input.angles[i] : "other",
    fingerprint: String(input.fingerprints[i] ?? "").toLowerCase(),
  }));
  const hint = input.hint?.trim().slice(0, 200) || null;
  const recognition = recognize(meta);
  const profile = profiles.find((p) => p.id === recognition.profileId);
  const query = profile?.query ?? hint ?? "";
  const search = await db().photoSearch.create({
    data: {
      viewerOrganizationId,
      hint,
      query,
      recognition: recognition as unknown as Prisma.InputJsonValue,
      images: {
        create: photos.map((photo, i) => ({ ...photo, angle: meta[i]!.angle, position: i })),
      },
    },
    select: { id: true },
  });
  return search.id;
}

export async function getPhotoSearch(id: string) {
  const search = await db().photoSearch.findUnique({
    where: { id },
    select: {
      id: true,
      hint: true,
      query: true,
      recognition: true,
      createdAt: true,
      images: { select: { id: true, angle: true }, orderBy: { position: "asc" } },
    },
  });
  if (!search) return null;
  return { ...search, recognition: search.recognition as unknown as Recognition };
}

/** Снимок поиска для `/api/photo-search/images/[id]`. Адрес знает только тот, кто искал. */
export async function getPhotoSearchImage(id: string) {
  const image = await db().photoSearchImage.findUnique({
    where: { id },
    select: { mimeType: true, data: true },
  });
  if (!image) throw new NotFoundError("Фото не найдено");
  return image;
}
