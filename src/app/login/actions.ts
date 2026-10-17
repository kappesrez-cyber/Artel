"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/form-state";
import { authenticate, registerAccount } from "@/server/auth/accounts";
import { endSession, startSession } from "@/server/auth/session";
import { checkbox, formFields, safeNext, toFormState } from "@/server/forms";

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formFields(form);
  let userId: string | null;
  try {
    userId = await authenticate({ email: form.get("email"), password: form.get("password") });
  } catch (error) {
    return { ...toFormState(error), values };
  }
  if (!userId) return { error: "Неверный email или пароль", values };
  await startSession(userId);
  redirect(safeNext(form.get("next"), "/profile"));
}

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formFields(form);
  let userId: string;
  try {
    userId = await registerAccount({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      organization: {
        name: form.get("organization.name"),
        inn: form.get("organization.inn"),
        city: form.get("organization.city"),
        isSeller: checkbox(form, "organization.isSeller"),
        isBuyer: checkbox(form, "organization.isBuyer"),
      },
    });
  } catch (error) {
    return { ...toFormState(error), values };
  }
  await startSession(userId);
  redirect("/profile?welcome=1");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
