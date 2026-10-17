"use client";

import { useState, useTransition } from "react";
import { buttonClass, secondaryButtonClass } from "@/components/form";
import { dealActionLabels } from "@/components/labels";
import type { DealAction } from "@/server/deals/transitions";
import { dealAction } from "../actions";

const confirmText: Partial<Record<DealAction, string>> = {
  cancel: "Отменить сделку? Это нельзя вернуть.",
  complete: "Подтвердить, что товар получен? Сделка станет успешной.",
};

export function DealActions({ dealId, actions }: { dealId: string; actions: DealAction[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pending}
            className={action === "cancel" ? secondaryButtonClass : buttonClass}
            onClick={() => {
              const question = confirmText[action];
              if (question && !window.confirm(question)) return;
              startTransition(async () => {
                const result = await dealAction(dealId, action);
                setError(result.error);
              });
            }}
          >
            {dealActionLabels[action]}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
