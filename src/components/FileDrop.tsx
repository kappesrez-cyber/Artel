"use client";

import { useRef, useState, type DragEvent } from "react";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} КБ`
    : `${(bytes / 1048576).toFixed(1)} МБ`;

/**
 * Поле для файлов с перетаскиванием. Список выбранных файлов можно пополнять и чистить
 * по одному: настоящий `<input type="file" name>` держит итоговый набор, поэтому файлы
 * уходят вместе с формой как обычно.
 */
export function FileDrop({
  name,
  title,
  hint,
  accept,
}: {
  name: string;
  title: string;
  hint: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);

  function apply(next: File[]) {
    const transfer = new DataTransfer();
    for (const file of next) transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
    setFiles(next);
  }

  // Новые файлы добавляются к уже выбранным; одинаковые (имя и размер) не дублируются.
  function add(list: FileList | null) {
    const incoming = [...(list ?? [])];
    const key = (f: File) => `${f.name}:${f.size}`;
    const known = new Set(files.map(key));
    apply([...files, ...incoming.filter((f) => !known.has(key(f)))]);
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    add(event.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        data-over={over || undefined}
        className="has-focus-visible:outline-brand data-over:border-brand data-over:bg-brand/5 hover:border-brand/60 flex cursor-pointer flex-col items-center gap-1 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          multiple
          accept={accept}
          className="sr-only"
          // Браузер заменяет выбор целиком, а `add` возвращает прежние файлы и добавляет новые.
          onChange={(e) => add(e.target.files)}
        />
        <span className="text-brand-dark text-lg font-extrabold">{title}</span>
        <span className="text-gray-500">{hint}</span>
        <span className="text-brand mt-1 font-bold">Выбрать или перетащить сюда</span>
      </label>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}:${file.size}`}
              className="animate-in-chip flex max-w-full items-center gap-2 rounded-full bg-white py-1.5 pr-2 pl-4 font-bold shadow-sm ring-1 ring-gray-200"
            >
              <span className="truncate" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-sm font-normal text-gray-500">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => apply(files.filter((_, j) => j !== i))}
                aria-label={`Убрать ${file.name}`}
                className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
