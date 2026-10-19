import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOrganizationUser } from "@/server/auth/access";
import { getOrganization } from "@/server/organizations/organizations";
import { Badge, Card, PageFallback, Section } from "@/components/ui";
import { CompanyForm } from "./CompanyForm";
import { LogoForm } from "./LogoForm";
import { refreshCompanyAssessment } from "../actions";
import { AssessmentPanel } from "@/components/Assessment";
import { getAssessment } from "@/server/assessment/assessment";

export const metadata: Metadata = { title: "О предприятии" };

async function Company() {
  const user = await requireOrganizationUser("/profile/company");
  const [o, assessment] = await Promise.all([
    getOrganization(user.organization.id),
    getAssessment(user.organization.id),
  ]);
  const text = (value: string | number | null) => (value === null ? "" : String(value));
  return (
    <div className="flex flex-col gap-8">
      <Section title="Логотип">
        <Card>
          <LogoForm organization={{ id: o.id, name: o.name, logo: o.logo }} />
        </Card>
      </Section>
      <Section
        title="ИИ-сводка о вас"
        action={
          <form action={refreshCompanyAssessment}>
            <button
              type="submit"
              className="hover:border-brand inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 px-5 py-2.5 font-bold text-gray-800 transition-colors"
            >
              Пересобрать сводку
            </button>
          </form>
        }
      >
        <p className="text-gray-600">
          Так вас видят покупатели. Загрузите отчётность и сертификаты в «Документах», завершайте
          сделки на платформе — и итог станет лучше.
        </p>
        <AssessmentPanel assessment={assessment} name={o.name} />
      </Section>
      <Section
        title="О предприятии"
        action={
          o.verifiedAt ? (
            <Badge tone="solid">Реквизиты проверены</Badge>
          ) : (
            <Badge tone="outline">Реквизиты не проверены</Badge>
          )
        }
      >
        <Card>
          <CompanyForm
            initial={{
              name: o.name,
              inn: text(o.inn),
              ogrn: text(o.ogrn),
              city: text(o.city),
              legalAddress: text(o.legalAddress),
              description: text(o.description),
              website: text(o.website),
              phone: text(o.phone),
              email: text(o.email),
              foundedYear: text(o.foundedYear),
              isSeller: o.isSeller,
              isBuyer: o.isBuyer,
            }}
          />
        </Card>
      </Section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Company />
    </Suspense>
  );
}
