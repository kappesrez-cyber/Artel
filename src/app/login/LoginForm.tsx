"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState, type FormState } from "@/components/form-state";
import { GuestLogin } from "@/components/GuestLogin";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, initialFormState);
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-brand-mist flex flex-col gap-3 rounded-3xl p-5">
        <p className="text-brand-dark">
          <b>Нет аккаунта или просто посмотреть?</b> Войдите в демо-кабинет производителя «ООО
          Техмаш-Юг»: каталог, сделки, заказы и аналитика без регистрации.
        </p>
        <GuestLogin next={next} tone="solid" />
      </div>
      <p className="flex items-center gap-3 text-sm text-gray-400 before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200">
        или по email
      </p>
      <LoginFields next={next} state={state} action={action} />
    </div>
  );
}

function LoginFields({
  next,
  state,
  action,
}: {
  next?: string;
  state: FormState;
  action: (form: FormData) => void;
}) {
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
