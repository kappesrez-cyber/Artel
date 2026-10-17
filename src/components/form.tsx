"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "./form-state";

export const inputClass =
  "w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-lg outline-none transition-colors placeholder:text-black/30 focus:border-brand aria-invalid:border-red-400";

export const buttonClass =
  "bg-brand inline-flex items-center justify-center rounded-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2.5 font-bold text-gray-800 transition-colors hover:border-brand disabled:opacity-50";

type FieldProps = {
  label: string;
  name: string;
  state?: FormState;
  hint?: ReactNode;
  className?: string;
};

function FieldShell({
  label,
  name,
  state,
  hint,
  className,
  children,
}: FieldProps & { children: ReactNode }) {
  const errors = state?.fieldErrors?.[name];
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="font-bold text-gray-700">{label}</span>
      {children}
      {errors?.length ? (
        <span id={`${name}-error`} className="text-sm text-red-600">
          {errors[0]}
        </span>
      ) : (
        hint && <span className="text-sm text-gray-500">{hint}</span>
      )}
    </label>
  );
}

export function Field({
  label,
  name,
  state,
  hint,
  className,
  ...input
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const invalid = Boolean(state?.fieldErrors?.[name]?.length);
  return (
    <FieldShell label={label} name={name} state={state} hint={hint} className={className}>
      <input
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${name}-error` : undefined}
        className={inputClass}
        {...input}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  state,
  hint,
  className,
  ...input
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const invalid = Boolean(state?.fieldErrors?.[name]?.length);
  return (
    <FieldShell label={label} name={name} state={state} hint={hint} className={className}>
      <textarea
        name={name}
        rows={4}
        aria-invalid={invalid || undefined}
        className={`${inputClass} resize-y`}
        {...input}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  name,
  state,
  hint,
  className,
  options,
  ...input
}: FieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & { options: readonly (readonly [string, string])[] }) {
  return (
    <FieldShell label={label} name={name} state={state} hint={hint} className={className}>
      <select name={name} className={inputClass} {...input}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-brand mt-1 size-5 shrink-0"
      />
      <span>
        <span className="font-bold text-gray-800">{label}</span>
        {hint && <span className="block text-sm text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  pendingText = "Сохраняем…",
  className = buttonClass,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Общее сообщение формы: ошибка красным, успех зелёным. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="rounded-2xl bg-green-50 px-4 py-3 text-green-800">
        {state.message}
      </p>
    );
  }
  return null;
}
