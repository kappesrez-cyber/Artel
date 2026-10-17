"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Field,
  FormMessage,
  Select,
  SubmitButton,
  TextArea,
  secondaryButtonClass,
} from "@/components/form";
import { initialFormState } from "@/components/form-state";
import { productStatusLabels } from "@/components/labels";
import { saveProduct } from "../actions";

export type ProductValues = Record<
  "name" | "description" | "price" | "leadTimeDays" | "city" | "status",
  string
>;

const statusOptions = Object.entries(productStatusLabels);

export function ProductForm({
  productId,
  initial,
}: {
  productId: string | null;
  initial: ProductValues;
}) {
  const [state, action] = useActionState(saveProduct.bind(null, productId), initialFormState);
  const v = { ...initial, ...state.values };
  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <Field
        label="Название"
        name="name"
        required
        placeholder="Подшипник 6205-2RS"
        defaultValue={v.name}
        state={state}
      />
      <TextArea
        label="Описание"
        name="description"
        placeholder="Характеристики, аналоги импортных позиций, материалы, допуски"
        defaultValue={v.description}
        state={state}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Цена за единицу, ₽"
          name="price"
          inputMode="decimal"
          required
          defaultValue={v.price}
          state={state}
        />
        <Field
          label="Срок производства, дней"
          name="leadTimeDays"
          type="number"
          min={0}
          required
          defaultValue={v.leadTimeDays}
          state={state}
        />
        <Field label="Город отгрузки" name="city" required defaultValue={v.city} state={state} />
      </div>
      <Select
        label="Статус"
        name="status"
        options={statusOptions}
        defaultValue={v.status}
        hint="Покупатели находят в поиске только опубликованные позиции"
        state={state}
      />
      <div className="flex flex-wrap gap-3">
        <SubmitButton>{productId ? "Сохранить" : "Добавить позицию"}</SubmitButton>
        <Link href="/profile/products" className={secondaryButtonClass}>
          Отмена
        </Link>
      </div>
    </form>
  );
}
