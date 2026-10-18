import { z } from "zod";

/**
 * Фотографии позиций и заказов. Браузер перед отправкой уменьшает снимок (см. `PhotoUpload`),
 * так что обычно это 200–500 КБ; ограничения ниже — на случай старого браузера или API.
 */
export const MAX_PHOTOS = 12;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
/** Server Action принимает до 5 МБ (next.config.ts), поэтому и вся отправка не больше 4 МБ. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const signatures: [string, (b: Uint8Array) => boolean][] = [
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["image/png", (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  [
    "image/webp",
    (b) =>
      String.fromCharCode(...b.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.subarray(8, 12)) === "WEBP",
  ],
  ["image/gif", (b) => String.fromCharCode(...b.subarray(0, 4)) === "GIF8"],
];

/** Тип снимка по первым байтам, а не по тому, что сказал браузер. Не картинка — `null`. */
export function detectImageType(bytes: Uint8Array): string | null {
  return signatures.find(([, test]) => test(bytes))?.[0] ?? null;
}

function fail(message: string, input: unknown): never {
  throw new z.ZodError([{ code: "custom", path: ["photos"], message, input }]);
}

export type PhotoData = { mimeType: string; size: number; data: Uint8Array<ArrayBuffer> };

/**
 * Проверить новые снимки: только JPEG, PNG, WebP и GIF, каждый до 4 МБ, всего не больше
 * `MAX_PHOTOS` вместе с уже загруженными. Пустые поля выбора файла отбрасываются.
 */
export async function readPhotos(files: File[], existing = 0): Promise<PhotoData[]> {
  const real = files.filter((file) => file.size > 0);
  if (real.length === 0) fail("Выберите фотографии", real);
  if (existing + real.length > MAX_PHOTOS) {
    fail(
      existing
        ? `Можно не больше ${MAX_PHOTOS} фото, уже загружено ${existing}`
        : `Можно не больше ${MAX_PHOTOS} фото`,
      real.length,
    );
  }
  const total = real.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_UPLOAD_BYTES) fail("За один раз — не больше 4 МБ фотографий", total);
  return Promise.all(
    real.map(async (file) => {
      if (file.size > MAX_PHOTO_BYTES) fail(`«${file.name}» больше 4 МБ`, file.size);
      const data = new Uint8Array(await file.arrayBuffer());
      const mimeType = detectImageType(data);
      if (!mimeType)
        fail(`«${file.name}» не похож на фотографию: нужен JPEG, PNG или WebP`, file.name);
      return { mimeType, size: data.byteLength, data };
    }),
  );
}
