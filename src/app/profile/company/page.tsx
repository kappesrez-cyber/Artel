import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOrganizationUser } from "@/server/auth/access";
import { getOrganization } from "@/server/organizations/organizations";
import { Badge, Card, PageFallback, Section } from "@/components/ui";
import { CompanyForm } from "./CompanyForm";

export const metadata: Metadata = { title: "О предприятии" };

async function Company() {
  const user = await requireOrganizationUser("/profile/company");
  const o = await getOrganization(user.organization.id);
  const text = (value: string | number | null) => (value === null ? "" : String(value));
  return (
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
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Company />
    </Suspense>
  );
}
