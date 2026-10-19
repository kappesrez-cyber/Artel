"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CameraIcon, SparkleIcon } from "@/components/icons";
import { imageFingerprint, shrinkImage } from "@/components/image-tools";
import { MAX_SEARCH_PHOTOS, photoAngles, type PhotoAngle } from "@/server/photo-search/angles";
import { searchByPhotos } from "./actions";

type Slot = { id: number; file: File; url: string; angle: PhotoAngle };

/** Пустые места, которые предлагаем заполнить: с этих сторон ИИ узнаёт деталь увереннее. */
const suggested: PhotoAngle[] = ["front", "side", "angle", "marking"];

const examples = [
  {
    name: "Подшипник",
    files: [
      ["bearing-1-front.jpg", "front"],
      ["bearing-3-side.jpg", "side"],
      ["bearing-2-angle.jpg", "angle"],
      ["bearing-4-marking.jpg", "marking"],
    ],
  },
  {
    name: "Гидрофильтр",
    files: [
      ["filter-1-side.jpg", "side"],
      ["filter-2-angle.jpg", "angle"],
      ["filter-3-top.jpg", "top"],
      ["filter-4-label.jpg", "marking"],
    ],
  },
] as const;

const demoDir = "/demo/photo-search/";

let nextId = 1;

/**
 * Поиск по фото: несколько снимков детали с разных сторон, у каждого — ракурс.
 * Перед отправкой браузер считает отпечаток каждого снимка и уменьшает его до 1600 px.
 */
export function PhotoSearchForm() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [hint, setHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const targetAngle = useRef<PhotoAngle | null>(null);
  const [dragging, setDragging] = useState(false);

  // Освобождаем превью, когда снимок убрали или страница закрылась.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const all = urls.current;
    return () => all.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function add(files: File[], angles: (PhotoAngle | null)[] = [], replace = false) {
    const base = replace ? [] : slots;
    const images = files.filter((file) => file.type.startsWith("image/"));
    const room = MAX_SEARCH_PHOTOS - base.length;
    setError(images.length > room ? `Можно приложить до ${MAX_SEARCH_PHOTOS} фото` : null);
    const next = [...base];
    images.slice(0, room).forEach((file, i) => {
      const taken = new Set(next.map((s) => s.angle));
      const angle =
        angles[i] ??
        (i === 0 ? targetAngle.current : null) ??
        suggested.find((a) => !taken.has(a)) ??
        "other";
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      next.push({ id: nextId++, file, url, angle });
    });
    setSlots(next);
    targetAngle.current = null;
  }

  function remove(id: number) {
    setSlots((current) => current.filter((s) => s.id !== id));
  }

  function pick(angle: PhotoAngle | null) {
    targetAngle.current = angle;
    inputRef.current?.click();
  }

  async function loadExample(example: (typeof examples)[number]) {
    setError(null);
    const files = await Promise.all(
      example.files.map(async ([name]) => {
        const blob = await (await fetch(demoDir + name)).blob();
        return new File([blob], name, { type: blob.type || "image/jpeg" });
      }),
    );
    add(
      files,
      example.files.map(([, angle]) => angle),
      true,
    );
  }

  function submit() {
    if (slots.length === 0) {
      setError("Добавьте хотя бы одно фото детали");
      return;
    }
    setError(null);
    startTransition(async () => {
      const form = new FormData();
      for (const slot of slots) {
        form.append("fingerprints", await imageFingerprint(slot.file));
        form.append("photos", await shrinkImage(slot.file, 1600, "image/jpeg"));
        form.append("angles", slot.angle);
      }
      form.append("hint", hint);
      const state = await searchByPhotos(form);
      if (state?.error) setError(state.error);
    });
  }

  const taken = new Set(slots.map((s) => s.angle));
  const empty = suggested.filter((a) => !taken.has(a)).slice(0, Math.max(0, 4 - slots.length));

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          add([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add([...e.dataTransfer.files]);
        }}
        className={`relative rounded-[2rem] border-2 border-dashed p-4 transition-colors md:p-6 ${dragging ? "border-brand bg-brand/5" : "border-gray-200 bg-white"}`}
      >
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {slots.map((slot, i) => (
            <li
              key={slot.id}
              className="group relative overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- превью из памяти браузера */}
              <img
                src={slot.url}
                alt={`Фото ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-2 bottom-2 flex items-center gap-2">
                <select
                  aria-label={`Ракурс фото ${i + 1}`}
                  value={slot.angle}
                  onChange={(e) =>
                    setSlots((all) =>
                      all.map((s) =>
                        s.id === slot.id ? { ...s, angle: e.target.value as PhotoAngle } : s,
                      ),
                    )
                  }
                  className="text-brand-dark min-w-0 flex-1 cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold shadow outline-none"
                >
                  {photoAngles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => remove(slot.id)}
                aria-label={`Убрать фото ${i + 1}`}
                className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full bg-white/95 text-lg leading-none font-bold text-gray-700 shadow hover:text-red-700"
              >
                ×
              </button>
              {pending && (
                <span
                  aria-hidden
                  className="via-brand/40 absolute inset-x-0 top-0 h-1/3 animate-[scan_1.6s_ease-in-out_infinite] bg-linear-to-b from-transparent to-transparent"
                />
              )}
            </li>
          ))}
          {empty.map((angle) => (
            <li key={angle}>
              <button
                type="button"
                onClick={() => pick(angle)}
                className="hover:border-brand hover:text-brand-dark flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-gray-200 bg-gray-50 text-gray-500 transition-colors"
              >
                <CameraIcon className="size-8" />
                <span className="font-bold">{photoAngles.find((a) => a.id === angle)!.label}</span>
              </button>
            </li>
          ))}
          {slots.length >= 4 && slots.length < MAX_SEARCH_PHOTOS && (
            <li>
              <button
                type="button"
                onClick={() => pick(null)}
                className="hover:border-brand flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-2 border-gray-200 bg-gray-50 font-bold text-gray-500"
              >
                <span className="text-3xl leading-none">+</span>
                Ещё фото
              </button>
            </li>
          )}
        </ul>
        <p className="mt-4 text-center text-gray-500">
          Перетащите сюда снимки или нажмите на место с ракурсом. До {MAX_SEARCH_PHOTOS} фото: чем
          больше сторон, тем точнее.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Где стоит деталь? Например: привод жатки Claas Lexion (необязательно)"
          maxLength={200}
          className="focus:border-brand min-w-0 flex-1 rounded-full border-2 border-gray-200 bg-white px-5 py-3.5 text-lg outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-brand-dark hover:bg-brand inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-extrabold text-white shadow-[0_8px_24px_rgb(23_55_128/0.35)] transition-colors disabled:opacity-70"
        >
          <SparkleIcon className={`size-5 ${pending ? "animate-spin" : ""}`} />
          {pending ? "ИИ сравнивает ракурсы…" : "Найти по фото"}
        </button>
      </div>
      {error && (
        <p role="alert" className="font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-3xl bg-gray-50 p-5 ring-1 ring-gray-200">
        <p className="font-bold text-gray-800">Нет детали под рукой? Попробуйте на примере:</p>
        <div className="flex flex-wrap gap-3">
          {examples.map((example) => (
            <button
              key={example.name}
              type="button"
              onClick={() => loadExample(example)}
              className="hover:border-brand flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white py-2 pr-4 pl-2 font-bold text-gray-800 transition-colors"
            >
              <span className="flex -space-x-3">
                {example.files.slice(0, 3).map(([name]) => (
                  // eslint-disable-next-line @next/next/no-img-element -- демо-снимки из public
                  <img
                    key={name}
                    src={demoDir + name}
                    alt=""
                    className="size-10 rounded-xl object-cover ring-2 ring-white"
                  />
                ))}
              </span>
              {example.name} · {example.files.length} фото
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          Демо-снимки можно скачать:{" "}
          {examples.flatMap((example) =>
            example.files.map(([name], i) => (
              <a
                key={name}
                href={demoDir + name}
                download
                className="text-brand mr-2 font-bold whitespace-nowrap hover:opacity-80"
              >
                {example.name.toLowerCase()} {i + 1}
              </a>
            )),
          )}
        </p>
      </div>
    </div>
  );
}
