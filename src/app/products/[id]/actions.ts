"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/form-state";
import { requireOrganizationUser } from "@/server/auth/access";
import { proposeDeal } from "@/server/deals/deals";
import { formFields, toFormState } from "@/server/forms";

export async function offerDeal(
  productId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireOrganizationUser(`/products/${productId}`);
  const values = formFields(form);
  try {
    await proposeDeal(user.organization.id, user.id, { ...values, productId });
  } catch (error) {
    return { ...toFormState(error), values };
  }
  redirect("/profile/deals");
}
