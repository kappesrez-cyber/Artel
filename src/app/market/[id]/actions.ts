"use server";

import { refresh } from "next/cache";
import type { FormState } from "@/components/form-state";
import { orderHref } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { formFields, toFormState } from "@/server/forms";
import { setOrderOpen } from "@/server/orders/orders";
import { boostOrder } from "@/server/stars/stars";

export async function boost(orderId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireOrganizationUser(orderHref(orderId));
  const values = formFields(form);
  try {
    await boostOrder(user.organization.id, user.id, orderId, values);
  } catch (error) {
    return { ...toFormState(error), values };
  }
  refresh();
  return { ok: true, message: `Готово: заказ поднят на ${values.stars} ★` };
}

export async function setOpen(orderId: string, open: boolean): Promise<void> {
  const user = await requireOrganizationUser(orderHref(orderId));
  await setOrderOpen(user.organization.id, orderId, open);
  refresh();
}
