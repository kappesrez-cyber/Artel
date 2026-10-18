"use client";

import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { documentKindLabels } from "@/components/labels";
import { addCompanyDocument } from "../actions";

const kindOptions = Object.entries(documentKindLabels);

export function DocumentForm() {
  const [state, action] = useActionState(addCompanyDocument, initialFormState);
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={action} className="flex flex-col gap-4" key={state.ok ? state.message : "form"}>
      <FormMessage state={state} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <Select
          label="Тип"
          name="kind"
          options={kindOptions}
          defaultValue={v.kind ?? "CERTIFICATE"}
          state={state}
        />
        <Field
          label="Название"
          name="title"
          required
          placeholder="Декларация соответствия ТР ТС 010/2011"
          defaultValue={v.title}
          state={state}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Номер" name="number" defaultValue={v.number} state={state} />
        <Field
          label="Дата выдачи"
          name="issuedAt"
          type="date"
          defaultValue={v.issuedAt}
          state={state}
        />
        <Field
          label="Действует до"
          name="validUntil"
          type="date"
          defaultValue={v.validUntil}
          state={state}
        />
      </div>
      <Field
        label="Ссылка на файл"
        name="url"
        type="url"
        placeholder="https://disk.yandex.ru/…"
        hint="Яндекс Диск, облако или сайт предприятия. Загрузка файлов прямо на платформу — следующим шагом"
        defaultValue={v.url}
        state={state}
      />
      <div>
        <SubmitButton pendingText="Добавляем…">Добавить документ</SubmitButton>
      </div>
    </form>
  );
}
