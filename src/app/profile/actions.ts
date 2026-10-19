"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/form-state";
import { refreshAssessment } from "@/server/assessment/assessment";
import { requireOrganizationUser } from "@/server/auth/access";
import { createProduct, updateProduct } from "@/server/catalog/products";
import { changeDealStatus, leaveReview, requestDocsHelp } from "@/server/deals/deals";
import type { DealAction } from "@/server/deals/transitions";
import { checkbox, formFields, toFormState } from "@/server/forms";
import {
  addDocument,
  deleteDocument,
  setDocumentVisibility,
} from "@/server/organizations/documents";
import { removeOrganizationLogo, setOrganizationLogo } from "@/server/organizations/logo";
import { updateOrganization } from "@/server/organizations/organizations";

// Каждое действие заново проверяет сессию: кнопку могли вызвать и без страницы кабинета.

export async function saveCompany(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireOrganizationUser();
  const values = formFields(form);
  try {
    await updateOrganization(user.organization.id, {
      ...values,
      isSeller: checkbox(form, "isSeller"),
      isBuyer: checkbox(form, "isBuyer"),
    });
  } catch (error) {
    return { ...toFormState(error), values };
  }
  refresh();
  return { ok: true, message: "Сохранено" };
}

export async function addCompanyDocument(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireOrganizationUser();
  const values = formFields(form);
  try {
    await addDocument(user.organization.id, { ...values, isPublic: checkbox(form, "isPublic") });
  } catch (error) {
    return { ...toFormState(error), values };
  }
  refresh();
  return { ok: true, message: "Документ добавлен" };
}

export async function toggleDocument(documentId: string, isPublic: boolean): Promise<void> {
  const user = await requireOrganizationUser();
  await setDocumentVisibility(user.organization.id, documentId, isPublic);
  refresh();
}

export async function removeDocument(documentId: string): Promise<void> {
  const user = await requireOrganizationUser();
  await deleteDocument(user.organization.id, documentId);
  refresh();
}

/** Новая позиция (без `productId`) или правка существующей. */
export async function saveProduct(
  productId: string | null,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireOrganizationUser();
  const values = formFields(form);
  const input = {
    name: values.name,
    description: values.description || null,
    article: values.article || null,
    analogs: values.analogs || null,
    price: values.price,
    leadTimeDays: values.leadTimeDays === "" ? undefined : Number(values.leadTimeDays),
    city: values.city,
    status: values.status,
  };
  try {
    if (!user.organization.isSeller) {
      return { error: "Включите режим продавца в профиле предприятия", values };
    }
    if (productId) await updateProduct(user.organization.id, productId, input);
    else await createProduct(user.organization.id, input);
  } catch (error) {
    return { ...toFormState(error), values };
  }
  redirect("/profile/products");
}

export async function setProductStatus(
  productId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): Promise<void> {
  const user = await requireOrganizationUser();
  if (!user.organization.isSeller) return;
  await updateProduct(user.organization.id, productId, { status });
  refresh();
}

export async function dealAction(dealId: string, action: DealAction): Promise<FormState> {
  const user = await requireOrganizationUser();
  try {
    await changeDealStatus(user.organization.id, dealId, action);
  } catch (error) {
    return toFormState(error);
  }
  refresh();
  return { ok: true };
}

/** Тариф Ultra: юрист платформы готовит документы по сделке. */
export async function requestDealDocs(dealId: string): Promise<FormState> {
  const user = await requireOrganizationUser();
  try {
    await requestDocsHelp(user.organization.id, user.id, dealId);
  } catch (error) {
    return toFormState(error);
  }
  refresh();
  return { ok: true };
}

export async function reviewDeal(
  dealId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireOrganizationUser();
  const values = formFields(form);
  try {
    await leaveReview(user.organization.id, dealId, values);
  } catch (error) {
    return { ...toFormState(error), values };
  }
  refresh();
  return { ok: true, message: "Спасибо за отзыв" };
}

export async function uploadCompanyLogo(form: FormData): Promise<FormState> {
  const user = await requireOrganizationUser();
  const file = form.get("logo");
  try {
    await setOrganizationLogo(user.organization.id, file instanceof File ? file : null);
  } catch (error) {
    const state = toFormState(error);
    return { error: state.fieldErrors?.logo?.[0] ?? state.error };
  }
  refresh();
  return { ok: true };
}

export async function deleteCompanyLogo(): Promise<void> {
  const user = await requireOrganizationUser();
  await removeOrganizationLogo(user.organization.id);
  refresh();
}

/** Пересобрать ИИ-сводку: после новых документов, сделок или отзывов. */
export async function refreshCompanyAssessment(): Promise<void> {
  const user = await requireOrganizationUser();
  await refreshAssessment(user.organization.id);
  refresh();
}
