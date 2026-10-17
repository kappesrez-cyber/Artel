"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/form-state";
import { orderHref, routes } from "@/components/navigation";
import { requireOrganizationUser } from "@/server/auth/access";
import { formFields, toFormState } from "@/server/forms";
import { createOrder } from "@/server/orders/orders";
import type { IncomingFile } from "@/server/orders/schemas";

const files = (form: FormData, name: string, kind: IncomingFile["kind"]): IncomingFile[] =>
  form
    .getAll(name)
    .filter((value): value is File => value instanceof File)
    .map((file) => ({ kind, file }));

export async function placeOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireOrganizationUser(routes.newOrder);
  const values = formFields(form);
  let id: string;
  try {
    ({ id } = await createOrder(user.organization.id, user.id, values, [
      ...files(form, "specFiles", "SPECIFICATION"),
      ...files(form, "techFiles", "TECHNICAL"),
    ]));
  } catch (error) {
    return { ...toFormState(error), values };
  }
  redirect(`${orderHref(id)}?placed=1`);
}
