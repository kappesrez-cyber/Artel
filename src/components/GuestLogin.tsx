"use client";

import { useFormStatus } from "react-dom";
import { loginAsGuest } from "@/app/login/actions";

const tones = {
  solid:
    "bg-brand-dark text-white hover:bg-brand-navy focus-visible:outline-brand-dark shadow-[var(--shadow-soft)]",
  outline:
    "border-2 border-brand-dark/25 bg-white text-brand-dark hover:border-brand-dark focus-visible:outline-brand-dark",
  light: "bg-white text-brand-dark hover:bg-brand-mist focus-visible:outline-white",
};

/**
 * Кнопка «Войти как гость (демо)»: стоит везде, где сайт просит войти. Гость попадает
 * в демо-кабинет производителя и возвращается на `next`.
 */
export function GuestLogin({
  next,
  tone = "outline",
  className = "",
  label = "Войти как гость (демо)",
}: {
  next?: string;
  tone?: keyof typeof tones;
  className?: string;
  label?: string;
}) {
  return (
    <form action={loginAsGuest} className={className}>
      <input type="hidden" name="next" value={next ?? ""} />
      <GuestButton tone={tone} label={label} />
    </form>
  );
}

function GuestButton({ tone, label }: { tone: keyof typeof tones; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${tones[tone]}`}
    >
      {pending ? "Входим…" : label}
    </button>
  );
}
