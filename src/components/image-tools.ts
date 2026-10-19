/**
 * Работа со снимками в браузере: уменьшить перед отправкой и посчитать отпечаток для
 * поиска по фото. Только для клиентских компонентов: нужны `createImageBitmap` и canvas.
 */

async function draw(file: Blob, maxSide: number, background?: string) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { canvas };
}

/**
 * Уменьшить картинку до `maxSide` по длинной стороне. PNG сохраняет прозрачность (логотипы),
 * JPEG — на белом фоне (фотографии). Если браузер не открыл файл, возвращается как есть.
 */
export async function shrinkImage(
  file: File,
  maxSide: number,
  type: "image/png" | "image/jpeg",
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const { canvas } = await draw(file, maxSide, type === "image/jpeg" ? "#fff" : undefined);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.86));
    if (!blob) return file;
    const ext = type === "image/png" ? ".png" : ".jpg";
    return new File([blob], file.name.replace(/\.\w+$/, "") + ext, { type });
  } catch {
    return file;
  }
}

/**
 * Отпечаток снимка (dHash 8×8): 16 шестнадцатеричных знаков. Почти не меняется при
 * пересжатии и уменьшении, поэтому по нему узнаются эталонные снимки демо-распознавания.
 */
export async function imageFingerprint(file: Blob): Promise<string> {
  try {
    // Уменьшаем ступенями вдвое: так каждая точка 9×8 — среднее по своему участку снимка.
    let { canvas } = await draw(file, 512, "#fff");
    while (canvas.width > 36 || canvas.height > 32) {
      const next = document.createElement("canvas");
      next.width = Math.max(9, Math.round(canvas.width / 2));
      next.height = Math.max(8, Math.round(canvas.height / 2));
      next.getContext("2d")!.drawImage(canvas, 0, 0, next.width, next.height);
      canvas = next;
    }
    const small = document.createElement("canvas");
    small.width = 9;
    small.height = 8;
    const sctx = small.getContext("2d", { willReadFrequently: true })!;
    sctx.drawImage(canvas, 0, 0, 9, 8);
    const { data } = sctx.getImageData(0, 0, 9, 8);
    const gray = (x: number, y: number) => {
      const i = (y * 9 + x) * 4;
      return data[i]! * 0.299 + data[i + 1]! * 0.587 + data[i + 2]! * 0.114;
    };
    let bits = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) bits += gray(x, y) < gray(x + 1, y) ? "1" : "0";
    }
    return (bits.match(/.{4}/g) ?? []).map((nibble) => parseInt(nibble, 2).toString(16)).join("");
  } catch {
    return "";
  }
}
