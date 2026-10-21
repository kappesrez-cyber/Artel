import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вход" };

async function Form({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={Array.isArray(next) ? next[0] : next} />;
}

export default function Page({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard title="Вход">
      <Suspense fallback={<LoginForm />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
