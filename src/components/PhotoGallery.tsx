"use client";

import { useRef, useState, useTransition } from "react";
import { removePhoto, setMainPhoto, uploadPhotos } from "@/app/photo-actions";
import { PhotoIcon } from "./icons";

type Owner = { productId: string } | { orderId: string };

const photoSrc = (id: string) => `/api/photos/${encodeURIComponent(id)}`;

/** Длинная сторона после уменьшения: хватает на весь экран и не раздувает базу. */
const MAX_SIDE = 1600;
/** Отправляем пачками: Server Action принимает до 5 МБ. */
const BATCH_BYTES = 3.5 * 1024 * 1024;

/**
 * Уменьшить снимок с телефона (часто 5–10 МБ) до JPEG в пару сотен килобайт.
 * Если браузер не умеет открыть файл (например, HEIC), отправляем как есть: сервер объяснит.
 */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 700 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Прозрачный PNG в JPEG стал бы чёрным: подкладываем белый фон.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function batches(files: File[]): File[][] {
  const out: File[][] = [];
  let size = Infinity;
  for (const file of files) {
    if (size + file.size > BATCH_BYTES) {
      out.push([]);
      size = 0;
    }
    out[out.length - 1].push(file);
    size += file.size;
  }
  return out;
}

/**
 * Фотографии позиции или заказа: большая первая, под ней миниатюры. Владельцу (`owner`)
 * здесь же можно добавить снимки, сделать любой главным или удалить.
 */
export function PhotoGallery({
  photos,
  alt,
  owner,
}: {
  photos: { id: string }[];
  alt: string;
  owner?: Owner;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // После удаления или смены главной список меняется: если выбранного больше нет, показываем первое.
  const current = photos.find((p) => p.id === selectedId) ?? photos[0];
  const index = current ? photos.indexOf(current) : -1;

  function upload(list: FileList | null) {
    const picked = [...(list ?? [])];
    if (!owner || picked.length === 0) return;
    setError(null);
    startTransition(async () => {
      const files = await Promise.all(picked.map(shrink));
      for (const batch of batches(files)) {
        const form = new FormData();
        for (const file of batch) form.append("photos", file);
        const result = await uploadPhotos(owner, form);
        if (result.error) {
          setError(result.error);
          break;
        }
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function act(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setError("Не получилось, обновите страницу и попробуйте ещё раз");
      }
    });
  }

  const addButton = owner && (
    <label
      aria-disabled={pending || undefined}
      className="has-focus-visible:outline-brand hover:border-brand hover:text-brand inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-gray-200 px-5 py-2.5 font-bold text-gray-800 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-50"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        disabled={pending}
        onChange={(e) => upload(e.target.files)}
      />
      <PhotoIcon className="size-5" />
      {pending ? "Загружаем…" : "Добавить фото"}
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      {current ? (
        <a
          href={photoSrc(current.id)}
          target="_blank"
          rel="noreferrer"
          title="Открыть в полном размере"
          className="group focus-visible:outline-brand relative block aspect-[4/3] overflow-hidden rounded-[2rem] border border-gray-200/80 bg-gray-50 shadow-[var(--shadow-soft)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- снимки отдаёт наш API, оптимизатор не нужен */}
          <img
            src={photoSrc(current.id)}
            alt={photos.length > 1 ? `${alt}, фото ${index + 1}` : alt}
            className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {photos.length > 1 && (
            <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-gray-800 shadow-sm">
              {index + 1} / {photos.length}
            </span>
          )}
        </a>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-gray-300 bg-gray-50 px-6 text-center">
          <PhotoIcon className="text-brand size-12" />
          <p className="text-lg font-bold text-gray-800">Фотографий пока нет</p>
          <p className="text-gray-500">
            Первое фото будет видно сразу, как только откроют страницу.
          </p>
        </div>
      )}

      {photos.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setSelectedId(photo.id)}
                aria-label={`Показать фото ${i + 1}`}
                aria-current={photo.id === current?.id || undefined}
                className="aria-current:ring-brand focus-visible:outline-brand block size-16 cursor-pointer overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200 transition-shadow hover:ring-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 aria-current:ring-3 md:size-20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- миниатюра того же снимка */}
                <img
                  src={photoSrc(photo.id)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {owner && (
        <div className="flex flex-wrap items-center gap-2">
          {addButton}
          {current && index > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act(() => setMainPhoto(current.id))}
              className="hover:border-brand inline-flex cursor-pointer items-center rounded-full border-2 border-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors disabled:opacity-50"
            >
              Сделать главным
            </button>
          )}
          {current && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("Удалить это фото?")) act(() => removePhoto(current.id));
              }}
              className="inline-flex cursor-pointer items-center rounded-full border-2 border-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
            >
              Удалить
            </button>
          )}
        </div>
      )}
      {owner && (
        <p className="text-sm text-gray-500">
          {current && index === 0 && photos.length > 1
            ? "Это главное фото: его видят первым. "
            : ""}
          JPEG, PNG или WebP, до 12 штук. Большие снимки уменьшаем сами.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
