import { describe, expect, it } from "vitest";
import { detectImageType, MAX_PHOTOS, readPhotos } from "./schemas";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
const html = new TextEncoder().encode("<html><script>alert(1)</script>");

const file = (bytes: Uint8Array, name = "photo.jpg", type = "image/jpeg") =>
  new File([bytes as Uint8Array<ArrayBuffer>], name, { type });

describe("detectImageType", () => {
  it("узнаёт снимок по первым байтам", () => {
    expect(detectImageType(jpeg)).toBe("image/jpeg");
    expect(detectImageType(png)).toBe("image/png");
    expect(detectImageType(webp)).toBe("image/webp");
    expect(detectImageType(html)).toBeNull();
  });
});

describe("readPhotos", () => {
  it("берёт тип из содержимого, а не из имени файла", async () => {
    const [photo] = await readPhotos([file(png, "x.jpg", "image/jpeg")]);
    expect(photo.mimeType).toBe("image/png");
    expect(photo.size).toBe(png.byteLength);
  });

  it("не принимает не-картинку, даже если браузер назвал её image/jpeg", async () => {
    await expect(readPhotos([file(html)])).rejects.toThrow(/не похож на фотографию/);
  });

  it("отбрасывает пустое поле выбора и требует хотя бы одно фото", async () => {
    await expect(readPhotos([new File([], "")])).rejects.toThrow(/Выберите фотографии/);
  });

  it("считает уже загруженные в лимит", async () => {
    await expect(readPhotos([file(jpeg), file(jpeg)], MAX_PHOTOS - 1)).rejects.toThrow(
      /уже загружено/,
    );
    await expect(readPhotos([file(jpeg)], MAX_PHOTOS - 1)).resolves.toHaveLength(1);
  });
});
