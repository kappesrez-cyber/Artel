import Link from "next/link";
import { Stars } from "@/components/ui";
import { formatMoment } from "@/server/catalog/format";
import { companyHref } from "./navigation";

type ReviewItem = {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  deal: { title: string };
  /** Чьё имя показать в карточке: автора (отзывы о нас) или адресата (наши отзывы). */
  organization: { id: string; name: string };
};

export function ReviewList({ reviews, prefix }: { reviews: ReviewItem[]; prefix?: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="flex flex-col gap-2 rounded-3xl border-2 border-gray-200 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">
              {prefix}
              <Link href={companyHref(review.organization.id)} className="text-brand">
                {review.organization.name}
              </Link>
            </span>
            <Stars rating={review.rating} />
          </div>
          <p className="whitespace-pre-line text-gray-800">{review.text}</p>
          <span className="text-sm text-gray-500">
            Сделка «{review.deal.title}» · {formatMoment(review.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
