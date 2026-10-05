import type { ProductReviewsResponse } from "@/contexts/backend/reviews/application/search-all/AllProductReviewsSearcher";
import type { ProductReviewStatusValue } from "@/contexts/backend/reviews/domain/ProductReviewStatus";
import {
	Badge,
	type BadgeColor,
} from "@/contexts/frontend/design-system/atoms/Badge";

import { ProductReviewForm } from "./ProductReviewForm";

import styles from "./ProductReviews.module.scss";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const maxRating = 5;

const ownStatusBadges: Record<
	ProductReviewStatusValue,
	{ label: string; color: BadgeColor }
> = {
	"pending-validation": { label: "Pending validation", color: "alt-3" },
	published: { label: "Published", color: "alt-1" },
	spam: { label: "Marked as spam", color: "alt-4" },
};

function OwnStatusBadge({ status }: { status: ProductReviewStatusValue }) {
	const { label, color } = ownStatusBadges[status];

	return <Badge color={color}>{label}</Badge>;
}

function Stars({ rating }: { rating: number }) {
	const rounded = Math.round(rating);

	return (
		<span
			className={styles.starsDisplay}
			role="img"
			aria-label={`${rating.toFixed(1)} out of ${maxRating} stars`}
		>
			{"★".repeat(rounded)}
			<span className={styles.starsEmpty}>
				{"★".repeat(maxRating - rounded)}
			</span>
		</span>
	);
}

type ProductReviewsProps = {
	productId: string;
	reviews: ProductReviewsResponse;
};

export function ProductReviews({ productId, reviews }: ProductReviewsProps) {
	return (
		<section className={styles.section} aria-labelledby="reviews-heading">
			<p className="eyebrow">Reviews</p>
			<div className={styles.header}>
				<h2 id="reviews-heading" className={styles.heading}>
					What customers say
				</h2>
				{reviews.averageRating === null ? (
					<p className={styles.summary}>No reviews yet</p>
				) : (
					<p className={styles.summary}>
						<Stars rating={reviews.averageRating} />
						<span>
							{reviews.averageRating.toFixed(1)} · {reviews.total}{" "}
							{reviews.total === 1 ? "review" : "reviews"}
						</span>
					</p>
				)}
			</div>

			<div className={styles.layout}>
				<div className={styles.list}>
					{reviews.reviews.length === 0 ? (
						<p className={styles.empty}>
							Be the first to review this product.
						</p>
					) : (
						reviews.reviews.map((review) => (
							<article key={review.id} className={styles.review}>
								<div className={styles.reviewHeader}>
									<Stars rating={review.rating} />
									{review.ownStatus ? (
										<OwnStatusBadge
											status={review.ownStatus}
										/>
									) : null}
								</div>
								{review.comment ? (
									<p className={styles.comment}>
										{review.comment}
									</p>
								) : null}
								<p className={styles.meta}>
									{review.authorName} ·{" "}
									{dateFormatter.format(
										new Date(review.createdAt),
									)}
								</p>
							</article>
						))
					)}
				</div>

				<aside className={styles.panel}>
					<h3 className={styles.panelHeading}>Write a review</h3>
					<ProductReviewForm productId={productId} />
				</aside>
			</div>
		</section>
	);
}
