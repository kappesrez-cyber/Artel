import type { Metadata } from "next";
import { Suspense } from "react";
import { dangerButtonClass } from "@/components/form";
import { documentKindLabels } from "@/components/labels";
import { requireOrganizationUser } from "@/server/auth/access";
import { formatDate } from "@/server/catalog/format";
import { listDocuments } from "@/server/organizations/documents";
import { removeDocument } from "../actions";
import { Badge, Card, Empty, PageFallback, Section } from "@/components/ui";
import { DocumentForm } from "./DocumentForm";

export const metadata: Metadata = { title: "Документы и отчёты" };

async function Documents() {
  const user = await requireOrganizationUser("/profile/documents");
  const documents = await listDocuments(user.organization.id);
  const today = new Date();
  return (
    <div className="flex flex-col gap-10">
      <Section title="Документы и отчёты">
        <p className="text-sm text-gray-600">
          Все документы видны на публичной странице предприятия.
        </p>
        {documents.length === 0 ? (
          <Empty>
            Здесь будут регистрационные документы, сертификаты, лицензии и отчётность предприятия.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {documents.map((doc) => {
              const expired = doc.validUntil && doc.validUntil < today;
              return (
                <li key={doc.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-sm text-gray-500">{documentKindLabels[doc.kind]}</span>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand text-lg font-bold hover:opacity-80"
                        >
                          {doc.title}
                        </a>
                      ) : (
                        <span className="text-lg font-bold">{doc.title}</span>
                      )}
                      <span className="text-sm text-gray-600">
                        {[
                          doc.number && `№ ${doc.number}`,
                          doc.issuedAt && `от ${formatDate(doc.issuedAt)}`,
                          doc.validUntil && `до ${formatDate(doc.validUntil)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {expired && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge tone="red">Истёк срок</Badge>
                        </div>
                      )}
                    </div>
                    <form action={removeDocument.bind(null, doc.id)}>
                      <button type="submit" className={dangerButtonClass}>
                        Удалить
                      </button>
                    </form>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Добавить документ">
        <Card>
          <DocumentForm />
        </Card>
      </Section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Documents />
    </Suspense>
  );
}
