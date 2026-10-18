"use client";

import { useState, useTransition } from "react";
import { secondaryButtonClass } from "@/components/form";
import { requestDealDocs } from "../actions";

/** Тариф Ultra: попросить юриста платформы подготовить документы по сделке. */
export function DocsHelp({ dealId, requestedAt }: { dealId: string; requestedAt: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  if (requestedAt) {
    return (
      <p className="bg-brand/10 text-brand-dark rounded-2xl px-4 py-3">
        Юрист платформы готовит договор, спецификацию и закрывающие документы и свяжется с вами по
        контактам предприятия.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          className={secondaryButtonClass}
          onClick={() =>
            startTransition(async () => {
              setError((await requestDealDocs(dealId)).error);
            })
          }
        >
          {pending ? "Отправляем…" : "Помочь с документами"}
        </button>
        <span className="text-sm text-gray-500">Входит в тариф Ultra</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
