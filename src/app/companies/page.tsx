import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { byImportance, ScoreRing, VerdictBadge } from "@/components/Assessment";
import { CompanyLogo } from "@/components/CompanyLogo";
import { plural } from "@/components/labels";
import { companyHref } from "@/components/navigation";
import { PageFallback } from "@/components/ui";
import { SparkleIcon } from "@/components/icons";
import { listAssessedSellers } from "@/server/assessment/assessment";

export const metadata: Metadata = { title: "Производители" };

async function Companies() {
  await connection();
  const sellers = await listAssessedSellers();
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sellers.map((s) => (
        <li key={s.id}>
          <Link
            href={companyHref(s.id)}
            className="group hover:border-brand flex h-full flex-col gap-4 rounded-[2rem] border-4 border-gray-200 bg-white p-5 transition-colors md:p-6"
          >
            <div className="flex items-center gap-4">
              <CompanyLogo organization={s} className="size-16 text-xl" />
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-xl leading-tight font-extrabold text-gray-900">
                  {s.name}
                </h2>
                <p className="truncate text-gray-500">
                  {[s.city && `г. ${s.city}`, plural(s.products, "позиция", "позиции", "позиций")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ScoreRing score={s.assessment.score} tone={s.assessment.tone} size={64} />
            </div>
            <VerdictBadge
              verdict={s.assessment.verdict}
              tone={s.assessment.tone}
              className="self-start px-4 py-1.5 text-base"
            />
            <p className="text-gray-700">{s.assessment.summary}</p>
            <ul className="mt-auto flex flex-col gap-1.5 text-sm text-gray-600">
              {byImportance(s.assessment.points)
                .slice(0, 3)
                .map((p) => (
                  <li key={p.text} className="flex gap-2">
                    <span
                      className={
                        p.kind === "ok"
                          ? "text-brand"
                          : p.kind === "warn"
                            ? "text-amber-600"
                            : "text-red-600"
                      }
                    >
                      {p.kind === "ok" ? "✓" : p.kind === "warn" ? "!" : "✕"}
                    </span>
                    {p.text}
                  </li>
                ))}
            </ul>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-brand-dark text-3xl leading-tight md:text-5xl">
          Производители
        </h1>
        <p className="flex max-w-3xl items-start gap-2 text-lg text-gray-600">
          <SparkleIcon className="text-brand mt-1 size-5 shrink-0" />
          ИИ проверяет каждого: отчётность, сделки, отзывы, суды и реальное производство, и подводит
          итог в пару слов.
        </p>
      </header>
      <Suspense fallback={<PageFallback />}>
        <Companies />
      </Suspense>
    </main>
  );
}
