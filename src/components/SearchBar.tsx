"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpIcon, CameraIcon, MicIcon, PlusCircleIcon } from "./icons";
import { routes } from "./navigation";
import { SearchDetails, type SearchViewer } from "./SearchDetails";

const iconButton =
  "shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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
    <div className="relative w-full max-w-[calc(var(--u)*1300)]">
      <Form
        action={routes.search}
        role="search"
        className="bg-brand-gray flex h-[calc(var(--u)*140)] w-full items-center rounded-[calc(var(--u)*73)] pr-[calc(var(--u)*41)] pl-[calc(var(--u)*20)]"
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="search-details"
          aria-label={open ? "Скрыть подробный запрос" : "Документы и подробный запрос"}
          className={`${iconButton} cursor-pointer`}
        >
          <PlusCircleIcon
            className={`size-[calc(var(--u)*90)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "rotate-[135deg]" : ""}`}
          />
        </button>

        <input
          type="search"
          name="q"
          aria-label="Что ищем?"
          placeholder="Вкусно и точка..."
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mx-[calc(var(--u)*28)] h-full min-w-0 flex-1 bg-transparent text-[calc(var(--u)*48)] font-bold tracking-[-0.04em] text-black outline-none placeholder:text-black/35 [&::-webkit-search-cancel-button]:hidden"
        />

        <div className="flex items-center gap-[calc(var(--u)*20)]">
          <Link href={routes.searchByVoice} aria-label="Голосовой поиск" className={iconButton}>
            <MicIcon className="size-[calc(var(--u)*60)]" />
          </Link>
          <Link
            href={routes.searchByPhoto}
            aria-label="Поиск по фото"
            className={`${iconButton} mr-[calc(var(--u)*23)]`}
          >
            <CameraIcon className="size-[calc(var(--u)*60)]" />
          </Link>
          <button
            type="submit"
            aria-label="Найти"
            className={`${iconButton} bg-brand-dark grid size-[calc(var(--u)*75)] cursor-pointer place-items-center`}
          >
            <ArrowUpIcon className="h-[calc(var(--u)*30)] w-auto" />
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
