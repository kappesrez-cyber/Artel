"use client";

import { useActionState } from "react";
import { Checkbox, Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { saveCompany } from "../actions";

export type CompanyValues = Record<
  | "name"
  | "inn"
  | "ogrn"
  | "city"
  | "legalAddress"
  | "description"
  | "website"
  | "phone"
  | "email"
  | "foundedYear",
  string
> & { isSeller: boolean; isBuyer: boolean };

export function CompanyForm({ initial }: { initial: CompanyValues }) {
  const [state, action] = useActionState(saveCompany, initialFormState);
  const v = { ...initial, ...state.values };
  const checked = (name: "isSeller" | "isBuyer") =>
    state.values && !state.ok ? state.values[name] === "on" : initial[name];
  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <Field label="Название" name="name" required defaultValue={v.name} state={state} />
      <TextArea
        label="О предприятии"
        name="description"
        rows={5}
        placeholder="Что производите, какие мощности и сертификаты, для каких отраслей работаете"
        defaultValue={v.description}
        state={state}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ИНН" name="inn" inputMode="numeric" defaultValue={v.inn} state={state} />
        <Field
          label="ОГРН / ОГРНИП"
          name="ogrn"
          inputMode="numeric"
          defaultValue={v.ogrn}
          state={state}
        />
        <Field label="Город" name="city" defaultValue={v.city} state={state} />
        <Field
          label="Год основания"
          name="foundedYear"
          inputMode="numeric"
          defaultValue={v.foundedYear}
          state={state}
        />
      </div>
      <Field
        label="Юридический адрес"
        name="legalAddress"
        defaultValue={v.legalAddress}
        state={state}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Телефон" name="phone" type="tel" defaultValue={v.phone} state={state} />
        <Field
          label="Email для заказов"
          name="email"
          type="email"
          defaultValue={v.email}
          state={state}
        />
        <Field label="Сайт" name="website" defaultValue={v.website} state={state} />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-bold text-gray-700">Режимы работы</legend>
        <Checkbox
          label="Продаём"
          name="isSeller"
          defaultChecked={checked("isSeller")}
          hint="Каталог позиций и входящие сделки"
        />
        <Checkbox
          label="Покупаем"
          name="isBuyer"
          defaultChecked={checked("isBuyer")}
          hint="Предложения сделок по позициям других предприятий"
        />
        {state.fieldErrors?.isSeller && (
          <p className="text-sm text-red-600">{state.fieldErrors.isSeller[0]}</p>
        )}
      </fieldset>
      <div>
        <SubmitButton>Сохранить</SubmitButton>
      </div>
    </form>
  );
}
