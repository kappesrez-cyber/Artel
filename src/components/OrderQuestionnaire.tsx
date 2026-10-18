"use client";

import type { ReactNode } from "react";
import { Field } from "./form";
import type { FormState } from "./form-state";
import {
  industryOptions,
  orderNeedKindLabels,
  orderRecurrenceLabels,
  requiredDocumentOptions,
} from "./labels";

/**
 * Опросник заказа: вопросы, которые производитель всё равно задаст заказчику, чтобы
 * подобрать замену импортной позиции. Общий для панели «+» строки поиска и формы заказа.
 * Только поля, без `<form>`: ответы уходят в `placeOrder` вместе с остальной формой.
 */

type Values = Record<string, string | undefined>;

/** Варианты-«таблетки»: радиокнопки или флажки, оформленные как кнопки. */
export function ChoiceChips({
  name,
  options,
  type = "radio",
  defaultValue,
}: {
  name: string;
  options: readonly (readonly [string, string])[];
  type?: "radio" | "checkbox";
  defaultValue?: string | readonly string[];
}) {
  const selected = new Set(
    Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [],
  );
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([value, label]) => (
        <label
          key={value}
          className="has-checked:border-brand has-checked:bg-brand has-focus-visible:outline-brand cursor-pointer rounded-full border-2 border-gray-200 bg-white px-4 py-2 font-bold text-gray-700 transition-colors select-none hover:border-gray-300 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
        >
          <input
            type={type}
            name={name}
            value={value}
            defaultChecked={selected.has(value)}
            className="sr-only"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

/** Вопрос опросника с номером: «1. Что нужно сделать?». */
export function Question({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="flex items-baseline gap-3 text-xl font-extrabold text-gray-900">
        <span className="bg-brand/10 text-brand-dark grid size-8 shrink-0 place-items-center rounded-full text-base">
          {n}
        </span>
        {title}
      </legend>
      {hint && <p className="-mt-1 pl-11 text-gray-500">{hint}</p>}
      <div className="flex flex-col gap-3 md:pl-11">{children}</div>
    </fieldset>
  );
}

const entries = <T extends Record<string, string>>(labels: T) =>
  Object.entries(labels) as [keyof T & string, string][];

/** Вопросы про заменяемую позицию: тип потребности, оригинал, применение, аналог, документы. */
export function ReplacementQuestions({
  v,
  state,
  start = 1,
}: {
  v: Values;
  state?: FormState;
  /** С какого номера нумеровать вопросы. */
  start?: number;
}) {
  return (
    <>
      <Question n={start} title="Что нужно сделать?">
        <ChoiceChips
          name="needKind"
          options={entries(orderNeedKindLabels)}
          defaultValue={v.needKind ?? "IMPORT_REPLACEMENT"}
        />
      </Question>

      <Question
        n={start + 1}
        title="Что заменяем?"
        hint="Бренд и артикул оригинала: по ним производитель быстрее всего найдёт аналог"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Field
            label="Бренд"
            name="originalBrand"
            placeholder="SKF"
            defaultValue={v.originalBrand}
            state={state}
          />
          <Field
            label="Артикул или модель"
            name="originalArticle"
            placeholder="6205-2RSH"
            defaultValue={v.originalArticle}
            state={state}
          />
        </div>
      </Question>

      <Question n={start + 2} title="Где применяется?">
        <Field
          label="Техника, линия или узел"
          name="application"
          placeholder="Комбайн Claas Lexion 760, привод жатки"
          defaultValue={v.application}
          state={state}
        />
        <ChoiceChips
          name="industry"
          options={industryOptions.map((o) => [o, o] as const)}
          defaultValue={v.industry}
        />
      </Question>

      <Question n={start + 3} title="Подойдёт ли аналог?">
        <ChoiceChips
          name="analogAllowed"
          options={[
            ["yes", "Да, с близкими характеристиками"],
            ["no", "Нет, строго по ТЗ"],
          ]}
          defaultValue={v.analogAllowed ?? "yes"}
        />
      </Question>

      <Question n={start + 4} title="Как часто нужна?">
        <ChoiceChips
          name="recurrence"
          options={entries(orderRecurrenceLabels)}
          defaultValue={v.recurrence ?? "ONCE"}
        />
      </Question>

      <Question n={start + 5} title="Какие документы нужны с поставкой?">
        <ChoiceChips
          name="requiredDocuments"
          type="checkbox"
          options={requiredDocumentOptions.map((o) => [o, o] as const)}
          defaultValue={v.requiredDocuments?.split("\n")}
        />
      </Question>
    </>
  );
}

/** Сколько вопросов в `ReplacementQuestions` — чтобы продолжить нумерацию. */
export const REPLACEMENT_QUESTIONS = 6;
