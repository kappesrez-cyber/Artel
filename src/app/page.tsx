import { SearchBar } from "@/components/SearchBar";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-[calc(var(--u)*24)] px-4 pb-[calc(var(--u)*160)]">
      <h1 className="font-display text-[calc(var(--u)*75)] leading-none font-black tracking-[-0.01em]">
        Привет!
      </h1>
      <SearchBar />
    </main>
  );
}
