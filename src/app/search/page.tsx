import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Результаты поиска" };

async function Query({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim();
  if (!query) return null;
  return <p className="text-xl">Вы искали: «{query}»</p>;
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return (
    <PlaceholderPage title="Результаты поиска">
      <Suspense>
        <Query searchParams={searchParams} />
      </Suspense>
    </PlaceholderPage>
  );
}
