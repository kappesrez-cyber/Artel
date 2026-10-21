"use client";

import { useRef, useState, useTransition } from "react";
import { CompanyLogo, type LogoOwner } from "@/components/CompanyLogo";
import { secondaryButtonClass } from "@/components/form";
import { shrinkImage } from "@/components/image-tools";
import { deleteCompanyLogo, uploadCompanyLogo } from "../actions";

/** Логотип предприятия: показывается в поиске, на карточках позиций и странице предприятия. */
export function LogoForm({ organization }: { organization: LogoOwner }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const form = new FormData();
      form.append("logo", await shrinkImage(file, 512, "image/png"));
      const state = await uploadCompanyLogo(form);
      if (state.error) setError(state.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <CompanyLogo organization={organization} className="size-24 text-3xl" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <label
            className={`${secondaryButtonClass} cursor-pointer ${pending ? "opacity-50" : ""}`}
          >
            {organization.logo ? "Заменить логотип" : "Загрузить логотип"}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={pending}
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          {organization.logo && (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteCompanyLogo())}
              className={`${secondaryButtonClass} cursor-pointer`}
            >
              Убрать
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {pending ? "Загружаем…" : "PNG, JPEG или WebP. Лучше квадратный, от 256 px."}
        </p>
        {error && (
          <p role="alert" className="text-sm font-bold text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
