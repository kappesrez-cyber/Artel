"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { boost } from "./actions";

/** «Продвинуть за звёзды»: заказчик поднимает свой заказ, другие предприятия — присоединяются. */
export function BoostForm({
  orderId,
  isCustomer,
  unit,
  balance,
}: {
  orderId: string;
  isCustomer: boolean;
  unit: string;
  balance: number;
}) {
  const [state, action] = useActionState(boost.bind(null, orderId), initialFormState);
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={action} className="flex flex-col gap-4" key={state.ok ? state.message : "form"}>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label="Звёзд"
          name="stars"
          type="number"
          min={1}
          max={Math.max(1, Math.min(balance, 100))}
          required
          defaultValue={v.stars ?? "1"}
          state={state}
          className="w-32"
        />
        {!isCustomer && (
          <Field
            label={`Нам тоже нужно, ${unit}`}
            name="quantity"
            type="number"
            min={1}
            placeholder="необязательно"
            defaultValue={v.quantity}
            state={state}
            className="w-56"
          />
        )}
      </div>
      {!isCustomer && (
        <TextArea
          label="Комментарий"
          name="comment"
          rows={2}
          placeholder="Например: нужна такая же партия к весне, доставка в Ростов"
          defaultValue={v.comment}
          state={state}
        />
      )}
      <div>
        <SubmitButton pendingText="Вкладываем…">
          {isCustomer ? "Поднять заказ" : "Поддержать заказ звёздами"}
        </SubmitButton>
      </div>
    </form>
  );
}
