"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { DisclosureIcon } from "@/components/icons";
import { ReplacementQuestions } from "@/components/OrderQuestionnaire";
import { StarAmount } from "@/components/ui";
import { placeOrder } from "./actions";

const fileInput =
  "file:bg-brand block w-full text-gray-700 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:px-5 file:py-2.5 file:font-bold file:text-white hover:file:opacity-85";

/** «Размещение карточки на заказ»: три раскрывающихся раздела из макета и блок звёзд. */
export function OrderForm({
  defaults,
  balance,
  buyStarsHref,
}: {
  defaults: Record<string, string>;
  balance: number;
  buyStarsHref: string;
}) {
  const [state, action] = useActionState(placeOrder, initialFormState);
  const v = state.values ?? defaults;
  const filesError = state.fieldErrors?.files?.[0];
  return (
    <form action={action} className="flex flex-col gap-8">
      <FormMessage state={state} />

      <Part title="Информация">
        <Field
          label="Что нужно"
          name="title"
          required
          placeholder="Подшипник 6205-2RS для комбайна"
          defaultValue={v.title}
          state={state}
        />
        <TextArea
          label="Описание"
          name="description"
          required
          rows={4}
          placeholder="Где используется, что заменяем (импортный аналог, артикул), особые условия"
          defaultValue={v.description}
          state={state}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px_1fr]">
          <Field
            label="Количество"
            name="quantity"
            type="number"
            min={1}
            defaultValue={v.quantity}
            state={state}
          />
          <Field label="Ед." name="unit" defaultValue={v.unit ?? "шт."} state={state} />
          <Field
            label="Бюджет, ₽"
            name="budget"
            inputMode="decimal"
            placeholder="по договорённости"
            defaultValue={v.budget}
            state={state}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Нужно к дате"
            name="deadline"
            type="date"
            defaultValue={v.deadline}
            state={state}
          />
          <Field label="Город поставки" name="city" defaultValue={v.city} state={state} />
        </div>
      </Part>

      <Part title="Подробности для подбора">
        <ReplacementQuestions v={v} state={state} />
      </Part>

      <Part title="Основное ТЗ">
        <TextArea
          label="Технические требования"
          name="specification"
          rows={6}
          placeholder="Размеры, материалы, допуски, стандарты (ГОСТ, ТУ), требования к упаковке и документам"
          defaultValue={v.specification}
          state={state}
        />
        <label className="flex flex-col gap-1.5">
          <span className="font-bold text-gray-700">Файл ТЗ</span>
          <input type="file" name="specFiles" multiple className={fileInput} />
        </label>
      </Part>

      <Part title="Техн. документация">
        <label className="flex flex-col gap-1.5">
          <span className="font-bold text-gray-700">Чертежи, схемы, паспорта, фото образца</span>
          <input type="file" name="techFiles" multiple className={fileInput} />
          <span className={`text-sm ${filesError ? "text-red-600" : "text-gray-500"}`}>
            {filesError ??
              "Все файлы вместе — до 4 МБ. Видны только предприятиям, которые вошли на платформу."}
          </span>
        </label>
      </Part>

      <Part title="Контакты">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Контактное лицо"
            name="contactName"
            required
            defaultValue={v.contactName}
            state={state}
          />
          <Field
            label="Телефон"
            name="contactPhone"
            type="tel"
            defaultValue={v.contactPhone}
            state={state}
          />
          <Field
            label="Email"
            name="contactEmail"
            type="email"
            defaultValue={v.contactEmail}
            state={state}
          />
        </div>
      </Part>

      <section className="border-brand/20 bg-brand/[0.05] flex flex-col gap-4 rounded-[calc(var(--u)*35)] border-2 p-5 md:p-6">
        <h2 className="text-[calc(var(--u)*56)] font-extrabold tracking-[-0.01em] max-md:text-2xl">
          Продвинуть за звёзды
        </h2>
        <p className="text-gray-700">
          Заказы со звёздами стоят на рынке выше остальных. Другие предприятия, которым нужна та же
          позиция, тоже смогут добавить свои звёзды.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <Field
            label="Вложить звёзд сразу"
            name="stars"
            type="number"
            min={0}
            max={Math.min(balance, 100)}
            defaultValue={v.stars ?? "0"}
            disabled={balance === 0}
            state={state}
            className="w-48"
          />
          <p className="pb-3 text-gray-700">
            На счету:{" "}
            <b>
              <StarAmount value={balance} />
            </b>
            .{" "}
            <Link href={buyStarsHref} className="text-brand font-bold hover:opacity-80">
              Купить звёзды
            </Link>
          </p>
        </div>
      </section>

      <div>
        <SubmitButton pendingText="Размещаем…">Разместить заказ</SubmitButton>
      </div>
    </form>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 max-md:justify-between [&::-webkit-details-marker]:hidden">
        <h2 className="text-[calc(var(--u)*75)] font-extrabold tracking-[-0.01em] max-md:text-2xl">
          {title}
        </h2>
        <DisclosureIcon />
      </summary>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </details>
  );
}
