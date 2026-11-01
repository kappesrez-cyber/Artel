"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpIcon, CameraIcon, MicIcon, PlusCircleIcon } from "./icons";
import { routes } from "./navigation";
import { SearchDetails, type SearchViewer } from "./SearchDetails";

const iconButton =
  "shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const toolButton = `${iconButton} text-brand-dark grid size-10 place-items-center hover:bg-brand/10`;

/**
 * Строка поиска главной страницы. Отправка ведёт на /search?q=…, «+» раскрывает панель
 * подробного запроса (документы и опросник, см. `SearchDetails`), остальные иконки — на свои страницы.
 */
export function SearchBar({ viewer = null }: { viewer?: SearchViewer }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative w-full max-w-3xl">
      <Form
        action={routes.search}
        role="search"
        className="focus-within:border-brand-dark flex h-14 w-full items-center rounded-full border-2 border-gray-200 bg-white pr-2 pl-2 transition-colors"
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="search-details"
          aria-label={open ? "Скрыть подробный запрос" : "Документы и подробный запрос"}
          className={`${iconButton} cursor-pointer hover:scale-105`}
        >
          <PlusCircleIcon
            className={`size-10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "rotate-[135deg]" : ""}`}
          />
        </button>

        <input
          type="search"
          name="q"
          aria-label="Что ищем?"
          placeholder="Деталь или артикул"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="placeholder:text-brand-dark/40 mx-3 h-full min-w-0 flex-1 bg-transparent text-lg font-bold text-gray-900 outline-none max-md:text-base [&::-webkit-search-cancel-button]:hidden"
        />

        <div className="flex items-center gap-1">
          <Link href={routes.searchByVoice} aria-label="Голосовой поиск" className={toolButton}>
            <MicIcon className="size-6" />
          </Link>
          <Link
            href={routes.searchByPhoto}
            aria-label="Поиск по фото"
            className={`${toolButton} mr-1`}
          >
            <CameraIcon className="size-6" />
          </Link>
          <button
            type="submit"
            aria-label="Найти"
            className={`${iconButton} bg-brand-dark hover:bg-brand grid size-10 cursor-pointer place-items-center`}
          >
            <ArrowUpIcon className="h-4 w-auto" />
          </button>
        </div>
      </Form>

      <SearchDetails
        open={open}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setOpen(false)}
        onReopen={() => setOpen(true)}
        viewer={viewer}
      />
    </div>
  );
}
