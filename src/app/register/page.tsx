import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Регистрация предприятия" };

export default function Page() {
  return (
    <AuthCard title="Регистрация предприятия">
      <p className="-mt-2 text-gray-600">
        Один аккаунт на предприятие: в нём можно и продавать, и покупать.
      </p>
      <RegisterForm />
    </AuthCard>
  );
}
