"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpIcon, CameraIcon, MicIcon, PlusCircleIcon } from "./icons";
import { routes } from "./navigation";
import { SearchDetails, type SearchViewer } from "./SearchDetails";

const iconButton =
  "shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const toolButton = `${iconButton} text-brand-dark grid size-[calc(var(--u)*84)] place-items-center hover:bg-brand/10 max-md:size-10`;

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
        className="glass focus-within:ring-brand/30 flex h-[calc(var(--u)*140)] w-full items-center rounded-[calc(var(--u)*73)] pr-[calc(var(--u)*30)] pl-[calc(var(--u)*20)] ring-0 transition-shadow focus-within:ring-[calc(var(--u)*6)] max-md:h-16"
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="search-details"
          aria-label={open ? "Скрыть подробный запрос" : "Документы и подробный запрос"}
          className={`${iconButton} cursor-pointer drop-shadow-[0_4px_10px_rgb(32_116_168/0.35)] hover:scale-105`}
        >
          <PlusCircleIcon
            className={`size-[calc(var(--u)*90)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-md:size-11 ${open ? "rotate-[135deg]" : ""}`}
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
          className="placeholder:text-brand-dark/40 mx-[calc(var(--u)*28)] h-full min-w-0 flex-1 bg-transparent text-[calc(var(--u)*48)] font-bold tracking-[-0.04em] text-gray-900 outline-none max-md:text-base [&::-webkit-search-cancel-button]:hidden"
        />

        <div className="flex items-center gap-[calc(var(--u)*6)]">
          <Link href={routes.searchByVoice} aria-label="Голосовой поиск" className={toolButton}>
            <MicIcon className="size-[calc(var(--u)*52)] max-md:size-6" />
          </Link>
          <Link
            href={routes.searchByPhoto}
            aria-label="Поиск по фото"
            className={`${toolButton} mr-[calc(var(--u)*18)]`}
          >
            <CameraIcon className="size-[calc(var(--u)*52)] max-md:size-6" />
          </Link>
          <button
            type="submit"
            aria-label="Найти"
            className={`${iconButton} bg-brand-dark hover:bg-brand grid size-[calc(var(--u)*84)] cursor-pointer place-items-center shadow-[0_6px_16px_rgb(25_88_126/0.35)] max-md:size-11`}
          >
            <ArrowUpIcon className="h-[calc(var(--u)*30)] w-auto max-md:h-4" />
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
