import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOrganizationUser } from "@/server/auth/access";
import { getOrganizationProduct } from "@/server/catalog/products";
import { NotFoundError } from "@/server/errors";
import { ProductForm } from "../ProductForm";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Card, PageFallback, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Изменить позицию" };

async function EditProduct({ params }: Pick<PageProps<"/profile/products/[id]">, "params">) {
  const { id } = await params;
  const { organization } = await requireOrganizationUser(`/profile/products/${id}`);
  const product = await getOrganizationProduct(organization.id, id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  return (
    <Section title={product.name}>
      <Card className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">Фотографии</h2>
        <div className="max-w-md">
          <PhotoGallery
            photos={product.photos}
            alt={product.name}
            owner={{ productId: product.id }}
          />
        </div>
      </Card>
      <Card>
        <ProductForm
          productId={product.id}
          initial={{
            name: product.name,
            article: product.article ?? "",
            analogs: product.analogs ?? "",
            description: product.description ?? "",
            price: product.price.replace(/\.00$/, ""),
            leadTimeDays: String(product.leadTimeDays),
            city: product.city,
            status: product.status,
          }}
        />
      </Card>
    </Section>
  );
}

export default function Page({ params }: PageProps<"/profile/products/[id]">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <EditProduct params={params} />
    </Suspense>
  );
}
