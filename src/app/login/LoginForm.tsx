"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        state={state}
      />
      <Field
        label="Пароль"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        state={state}
      />
      <SubmitButton pendingText="Входим…">Войти</SubmitButton>
      <p className="text-center text-gray-600">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-brand font-bold hover:opacity-80">
          Зарегистрировать предприятие
        </Link>
      </p>
    </form>
  );
}
