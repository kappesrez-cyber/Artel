import "server-only";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { readPhotos } from "./schemas";

/**
 * Фотографии позиции каталога или заказа на рынке. Загружает и меняет их только владелец:
 * производитель позиции или заказчик. Смотреть можно всем, пока позиция опубликована
 * или заказ открыт; иначе — только владельцу.
 */

export type PhotoOwner = { productId: string } | { orderId: string };

/** Порядок показа: первая — главная, она же на странице сразу. */
export const photoOrder = [{ position: "asc" as const }, { createdAt: "asc" as const }];

async function assertOwner(organizationId: string, owner: PhotoOwner) {
  const found =
    "productId" in owner
      ? await db().product.count({ where: { id: owner.productId, organizationId } })
      : await db().order.count({ where: { id: owner.orderId, customerId: organizationId } });
  if (!found)
    throw new NotFoundError("productId" in owner ? "Позиция не найдена" : "Заказ не найден");
}

export async function addPhotos(organizationId: string, owner: PhotoOwner, files: File[]) {
  await assertOwner(organizationId, owner);
  const where = owner;
  const [existing, last] = await Promise.all([
    db().photo.count({ where }),
    db().photo.aggregate({ where, _max: { position: true } }),
  ]);
  const photos = await readPhotos(files, existing);
  const start = (last._max.position ?? -1) + 1;
  await db().photo.createMany({
    data: photos.map((photo, i) => ({ ...owner, ...photo, position: start + i })),
  });
}

/** Фото, которое принадлежит позиции или заказу этого предприятия. */
async function ownedPhoto(organizationId: string, photoId: string) {
  const photo = await db().photo.findFirst({
    where: {
      id: photoId,
      OR: [{ product: { organizationId } }, { order: { customerId: organizationId } }],
    },
    select: { id: true, productId: true, orderId: true },
  });
  if (!photo) throw new NotFoundError("Фото не найдено");
  return photo;
}

export async function deletePhoto(organizationId: string, photoId: string) {
  const photo = await ownedPhoto(organizationId, photoId);
  await db().photo.delete({ where: { id: photo.id } });
}

/** Сделать фото главным: оно встаёт первым и показывается на странице сразу. */
export async function makePhotoMain(organizationId: string, photoId: string) {
  const photo = await ownedPhoto(organizationId, photoId);
  const where = photo.productId ? { productId: photo.productId } : { orderId: photo.orderId };
  const first = await db().photo.aggregate({ where, _min: { position: true } });
  await db().photo.update({
    where: { id: photo.id },
    data: { position: (first._min.position ?? 0) - 1 },
  });
}

/** Сам снимок для `/api/photos/[id]`. `isPublic` — можно ли кешировать для всех. */
export async function getPhotoFile(photoId: string, viewerOrganizationId: string | null) {
  const photo = await db().photo.findUnique({
    where: { id: photoId },
    select: {
      mimeType: true,
      data: true,
      product: { select: { status: true, organizationId: true } },
      order: { select: { status: true, customerId: true } },
    },
  });
  if (!photo) throw new NotFoundError("Фото не найдено");
  const isPublic = photo.product
    ? photo.product.status === "PUBLISHED"
    : photo.order?.status === "OPEN";
  const ownerId = photo.product?.organizationId ?? photo.order?.customerId;
  if (!isPublic && (!viewerOrganizationId || ownerId !== viewerOrganizationId)) {
    throw new NotFoundError("Фото не найдено");
  }
  return { mimeType: photo.mimeType, data: photo.data, isPublic };
}
