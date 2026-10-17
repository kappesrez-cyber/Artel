import Link from "next/link";
import { Suspense } from "react";
import { companyHref } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { logout } from "../login/actions";
import { CabinetNav, CabinetNavList } from "./CabinetNav";
import { RoleBadges } from "@/components/ui";

async function CabinetHeader() {
  const { name, organization } = await requireOrganizationUser();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-gray-500">Личный кабинет · {name}</p>
        <h1 className="font-display text-brand-dark text-3xl leading-tight md:text-4xl">
          {organization.name}
        </h1>
        <RoleBadges isSeller={organization.isSeller} isBuyer={organization.isBuyer} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={companyHref(organization.id)} className="text-brand font-bold hover:opacity-80">
          Публичная страница →
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border-2 border-gray-200 px-4 py-2 font-bold text-gray-600 transition-colors hover:border-gray-400"
          >
            Выйти
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps<"/profile">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-8 md:py-10">
      <Suspense fallback={<div className="h-24 animate-pulse rounded-3xl bg-gray-100" />}>
        <CabinetHeader />
      </Suspense>
      <div className="mt-8 grid items-start gap-6 md:grid-cols-[240px_1fr] md:gap-10">
        <Suspense fallback={<CabinetNavList pathname={null} />}>
          <CabinetNav />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
