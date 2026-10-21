"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/form-state";
import { getCurrentUser } from "@/server/auth/session";
import { toFormState } from "@/server/forms";
import { createPhotoSearch } from "@/server/photo-search/photo-search";

/** Поиск по фото: войти не обязательно. После распознавания — на страницу результата. */
export async function searchByPhotos(form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const strings = (name: string) => form.getAll(name).map(String);
  let id: string;
  try {
    id = await createPhotoSearch(user?.organization?.id ?? null, {
      files: form.getAll("photos").filter((v): v is File => v instanceof File),
      angles: strings("angles"),
      fingerprints: strings("fingerprints"),
      hint: form.get("hint")?.toString(),
    });
  } catch (error) {
    const state = toFormState(error);
    return { error: state.fieldErrors?.photos?.[0] ?? state.error };
  }
  redirect(`/search/photo/${encodeURIComponent(id)}`);
}
