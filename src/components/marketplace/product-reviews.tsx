import { ReviewForm } from "@/components/marketplace/review-form";
import { Avatar } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { name: string };
};

export function ProductReviews({
  productId,
  reviews,
  ratingAvg,
  ratingCount,
  canReview,
  isAuthenticated,
}: {
  productId: string;
  reviews: ReviewItem[];
  ratingAvg: number;
  ratingCount: number;
  canReview: boolean;
  isAuthenticated: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {reviews.length ? (
          reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={review.user.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-crow-text">
                    {review.user.name}
                  </p>
                  <p className="text-[11px] text-crow-muted">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <span className="text-[12px] text-crow-warn">
                  {"★".repeat(review.rating)}
                  <span className="text-white/20">{"★".repeat(5 - review.rating)}</span>
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-crow-muted">
                {review.comment}
              </p>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center text-[13px] text-crow-muted">
            Este producto todavía no tiene reviews.
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">
            Valoración media
          </p>
          <p className="mt-2 text-3xl font-semibold text-crow-text">
            {ratingAvg ? ratingAvg.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-[12px] text-crow-muted">
            {ratingCount} review{ratingCount === 1 ? "" : "s"} verificadas
          </p>
        </Card>
        <ReviewForm
          productId={productId}
          canReview={canReview}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}