"use client";

import { useRef, useState } from "react";
import { PlusCircleIcon } from "./icons";

/**
 * Кнопка «+» строки поиска: открывает выбор файла (чертёж, спецификация, фото детали)
 * и показывает выбранное имя. Отправка файла появится вместе с бэкендом поиска,
 * поэтому у поля нет `name` и в запрос оно пока не попадает.
 */
export function AttachFileButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setFileName(null);
  }

  return (
    <>
      <label
        aria-label="Прикрепить файл"
        className="has-focus-visible:outline-brand shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80 has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <PlusCircleIcon className="size-[calc(var(--u)*90)]" />
      </label>

      {fileName && (
        <span className="text-brand-dark ml-[calc(var(--u)*20)] flex max-w-[30%] shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold md:text-[calc(var(--u)*28)]">
          <span className="truncate" title={fileName}>
            {fileName}
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label="Убрать файл"
            className="cursor-pointer leading-none hover:opacity-70"
          >
            ×
          </button>
        </span>
      )}
    </>
  );
}
