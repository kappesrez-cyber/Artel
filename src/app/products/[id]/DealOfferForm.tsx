"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { offerDeal } from "./actions";

export function DealOfferForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(offerDeal.bind(null, productId), initialFormState);
  const v = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <Field
        label="Количество, шт."
        name="quantity"
        type="number"
        min={1}
        required
        defaultValue={v.quantity ?? "1"}
        state={state}
      />
      <TextArea
        label="Комментарий для производителя"
        name="comment"
        rows={2}
        placeholder="Сроки, доставка, требования к документам"
        defaultValue={v.comment}
        state={state}
      />
      <SubmitButton
        pendingText="Отправляем…"
        className="bg-brand-dark hover:bg-brand-navy inline-flex w-full cursor-pointer items-center justify-center rounded-full py-3 text-base font-bold text-white transition-colors disabled:opacity-50"
      >
        Предложить сделку
      </SubmitButton>
    </form>
  );
}
