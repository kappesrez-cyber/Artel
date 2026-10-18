import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOrganizationUser } from "@/server/auth/access";
import { getOrganization } from "@/server/organizations/organizations";
import { ProductForm } from "../ProductForm";
import { Card, PageFallback, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Новая позиция" };

async function NewProduct() {
  const { organization } = await requireOrganizationUser("/profile/products/new");
  const { city } = await getOrganization(organization.id);
  return (
    <Section title="Новая позиция">
      <Card>
        <ProductForm
          productId={null}
          initial={{
            name: "",
            article: "",
            analogs: "",
            description: "",
            price: "",
            leadTimeDays: "",
            city: city ?? "",
            status: "DRAFT",
          }}
        />
      </Card>
    </Section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <NewProduct />
    </Suspense>
  );
}
