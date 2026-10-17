import Form from "next/form";
import Link from "next/link";
import { AttachFileButton } from "./AttachFileButton";
import { ArrowUpIcon, CameraIcon, MicIcon } from "./icons";
import { routes } from "./navigation";

const iconButton =
  "shrink-0 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Строка поиска главной страницы. Отправка ведёт на /search?q=…, «+» прикрепляет файл,
 * остальные иконки — на свои страницы.
 */
export function SearchBar() {
  return (
    <Form
      action={routes.search}
      role="search"
      className="bg-brand-gray flex h-[calc(var(--u)*140)] w-full max-w-[calc(var(--u)*1300)] items-center rounded-[calc(var(--u)*73)] pr-[calc(var(--u)*41)] pl-[calc(var(--u)*20)]"
    >
      <AttachFileButton />

      <input
        type="search"
        name="q"
        aria-label="Что ищем?"
        placeholder="Вкусно и точка..."
        autoComplete="off"
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
  );
}
