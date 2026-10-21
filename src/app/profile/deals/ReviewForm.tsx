"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextArea } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { StarIcon } from "@/components/icons";
import { reviewDeal } from "../actions";

export function ReviewForm({ dealId, counterpart }: { dealId: string; counterpart: string }) {
  const [state, action] = useActionState(reviewDeal.bind(null, dealId), initialFormState);
  if (state.ok) return <FormMessage state={state} />;
  const v = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-3 rounded-3xl bg-gray-50 p-4">
      <FormMessage state={state} />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-bold text-gray-700">Отзыв о «{counterpart}»</legend>
        <div className="flex flex-row-reverse justify-end gap-1 text-3xl">
          {[5, 4, 3, 2, 1].map((n) => (
            // Порядок обратный (5…1), поэтому «звёзды левее выбранной» — следующие соседи в DOM.
            <label
              key={n}
              className="[&:has(:checked)~label>span]:text-brand [&:hover~label>span]:text-brand/70 cursor-pointer"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                required
                defaultChecked={v.rating === String(n)}
                className="peer sr-only"
                aria-label={`${n} из 5`}
              />
              <span className="text-brand-gray peer-checked:text-brand hover:text-brand/70 block transition-colors peer-focus-visible:outline-2">
                <StarIcon className="size-[1em]" />
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.rating && (
          <span className="text-sm text-red-600">{state.fieldErrors.rating[0]}</span>
        )}
      </fieldset>
      <TextArea
        label="Как прошла сделка"
        name="text"
        rows={3}
        required
        placeholder="Сроки, качество, документы, связь"
        defaultValue={v.text}
        state={state}
      />
      <div>
        <SubmitButton pendingText="Отправляем…">Оставить отзыв</SubmitButton>
      </div>
    </form>
  );
}
