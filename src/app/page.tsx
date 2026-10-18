import { Suspense } from "react";
import { SearchBar } from "@/components/SearchBar";
import { getCurrentUser } from "@/server/auth/session";

/** Строка поиска с данными вошедшего: ими заполняются контакты в опроснике под «+». */
async function SearchForViewer() {
  const user = await getCurrentUser();
  return <SearchBar viewer={user?.organization ? { name: user.name, email: user.email } : null} />;
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-[calc(var(--u)*24)] px-4 pt-[calc(var(--u)*48)] pb-[calc(var(--u)*160)] max-md:pt-6">
      <h1 className="font-display text-[calc(var(--u)*75)] leading-none tracking-[-0.01em]">
        Привет!
      </h1>
      <Suspense fallback={<SearchBar />}>
        <SearchForViewer />
      </Suspense>
    </main>
  );
}
