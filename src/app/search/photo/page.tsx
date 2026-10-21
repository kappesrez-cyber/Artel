import type { Metadata } from "next";
import { SparkleIcon } from "@/components/icons";
import { PhotoSearchForm } from "./PhotoSearchForm";

export const metadata: Metadata = { title: "Поиск по фото" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-brand-dark text-3xl leading-tight md:text-5xl">
          Поиск по фото
        </h1>
        <p className="flex max-w-3xl items-start gap-2 text-lg text-gray-600">
          <SparkleIcon className="text-brand mt-1 size-5 shrink-0" />
          Снимите импортную деталь с нескольких сторон и крупно маркировку. ИИ определит, что это, и
          подберёт отечественную замену у проверенных производителей.
        </p>
      </header>
      <PhotoSearchForm />
    </main>
  );
}
