"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Checkbox, Field, FormMessage, SubmitButton } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { register } from "../login/actions";

export function RegisterForm() {
  const [state, action] = useActionState(register, initialFormState);
  const v = state.values ?? {};
  // После неудачной отправки чекбоксы восстанавливаются из введённого.
  const checked = (name: string) => (state.values ? v[name] === "on" : true);
  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage state={state} />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-extrabold">Предприятие</legend>
        <Field
          label="Название"
          name="organization.name"
          placeholder="ООО «Агромаш»"
          required
          defaultValue={v["organization.name"]}
          state={state}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="ИНН"
            name="organization.inn"
            inputMode="numeric"
            hint="Можно заполнить позже"
            defaultValue={v["organization.inn"]}
            state={state}
          />
          <Field
            label="Город"
            name="organization.city"
            defaultValue={v["organization.city"]}
            state={state}
          />
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <Checkbox
            label="Продаём"
            name="organization.isSeller"
            defaultChecked={checked("organization.isSeller")}
            hint="Размещаем свою продукцию в каталоге и принимаем заказы"
          />
          <Checkbox
            label="Покупаем"
            name="organization.isBuyer"
            defaultChecked={checked("organization.isBuyer")}
            hint="Ищем замену импортным комплектующим и заказываем у производителей"
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-xl font-extrabold">Контактное лицо</legend>
        <Field
          label="Имя"
          name="name"
          autoComplete="name"
          required
          defaultValue={v.name}
          state={state}
        />
        <Field
          label="Рабочий email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={v.email}
          state={state}
        />
        <Field
          label="Пароль"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          hint="Не короче 8 символов"
          state={state}
        />
      </fieldset>

      <SubmitButton pendingText="Создаём аккаунт…">Зарегистрироваться</SubmitButton>
      <p className="text-center text-gray-600">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-brand font-bold hover:opacity-80">
          Войти
        </Link>
      </p>
    </form>
  );
}
