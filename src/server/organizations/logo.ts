import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { detectImageType } from "@/server/photos/schemas";

/** Браузер присылает логотип уже уменьшенным до 512 px (см. `LogoForm`); запас на старые браузеры. */
export const MAX_LOGO_BYTES = 1024 * 1024;
const logoTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function fail(message: string): never {
  throw new z.ZodError([{ code: "custom", path: ["logo"], message, input: null }]);
}

/** Проверить картинку логотипа: PNG, JPEG или WebP до 1 МБ. Тип — по первым байтам файла. */
export async function readLogo(file: File | null) {
  if (!file || file.size === 0) fail("Выберите картинку с логотипом");
  if (file.size > MAX_LOGO_BYTES) fail("Логотип больше 1 МБ");
  const data = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageType(data);
  if (!mimeType || !logoTypes.has(mimeType)) fail("Нужна картинка PNG, JPEG или WebP");
  return { mimeType, size: data.byteLength, data };
}

export async function setOrganizationLogo(organizationId: string, file: File | null) {
  const logo = await readLogo(file);
  await db().organizationLogo.upsert({
    where: { organizationId },
    create: { organizationId, ...logo },
    update: logo,
  });
}

export async function removeOrganizationLogo(organizationId: string) {
  await db().organizationLogo.deleteMany({ where: { organizationId } });
}

/** Сам файл для `/api/organizations/[id]/logo`. Логотип публичный, как название предприятия. */
export async function getLogoFile(organizationId: string) {
  const logo = await db().organizationLogo.findUnique({
    where: { organizationId },
    select: { mimeType: true, data: true },
  });
  if (!logo) throw new NotFoundError("Логотипа нет");
  return logo;
}
