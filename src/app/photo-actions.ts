"use server";

import { refresh } from "next/cache";
import type { FormState } from "@/components/form-state";
import { requireOrganizationUser } from "@/server/auth/access";
import { toFormState } from "@/server/forms";
import { addPhotos, deletePhoto, makePhotoMain, type PhotoOwner } from "@/server/photos/photos";

// Фото позиций и заказов. Владельца каждое действие проверяет заново в `src/server/photos`.

export async function uploadPhotos(owner: PhotoOwner, form: FormData): Promise<FormState> {
  const user = await requireOrganizationUser();
  const files = form.getAll("photos").filter((value): value is File => value instanceof File);
  try {
    await addPhotos(user.organization.id, owner, files);
  } catch (error) {
    const state = toFormState(error);
    return { error: state.fieldErrors?.photos?.[0] ?? state.error };
  }
  refresh();
  return { ok: true };
}

export async function removePhoto(photoId: string): Promise<void> {
  const user = await requireOrganizationUser();
  await deletePhoto(user.organization.id, photoId);
  refresh();
}

export async function setMainPhoto(photoId: string): Promise<void> {
  const user = await requireOrganizationUser();
  await makePhotoMain(user.organization.id, photoId);
  refresh();
}
