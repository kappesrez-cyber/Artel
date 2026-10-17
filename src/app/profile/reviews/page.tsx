import type { Metadata } from "next";
import { Suspense } from "react";
import { plural } from "@/components/labels";
import { ReviewList } from "@/components/ReviewList";
import { requireOrganizationUser } from "@/server/auth/access";
import { listReviews } from "@/server/deals/deals";
import { getOrganizationStats } from "@/server/organizations/organizations";
import { Empty, PageFallback, Section, Stars } from "@/components/ui";

export const metadata: Metadata = { title: "Отзывы" };

async function Reviews() {
  const { organization } = await requireOrganizationUser("/profile/reviews");
  const [{ received, written }, stats] = await Promise.all([
    listReviews(organization.id),
    getOrganizationStats(organization.id),
  ]);
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Отзывы о нас"
        action={
          stats.averageRating !== null && (
            <span className="flex items-center gap-2 text-lg font-bold">
              <Stars rating={stats.averageRating} /> {stats.averageRating} ·{" "}
              {plural(stats.reviewsCount, "отзыв", "отзыва", "отзывов")}
            </span>
          )
        }
      >
        {received.length === 0 ? (
          <Empty>
            Отзывы оставляют контрагенты после успешной сделки, поэтому им можно доверять.
          </Empty>
        ) : (
          <ReviewList
            reviews={received.map((r) => ({ ...r, organization: r.authorOrganization }))}
          />
        )}
      </Section>
      <Section title="Наши отзывы">
        {written.length === 0 ? (
          <Empty>Оставить отзыв можно в разделе «Сделки» после завершения сделки.</Empty>
        ) : (
          <ReviewList
            prefix="О компании "
            reviews={written.map((r) => ({ ...r, organization: r.targetOrganization }))}
          />
        )}
      </Section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Reviews />
    </Suspense>
  );
}
