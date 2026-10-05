"use client";

import { useActionState } from "react";

import { Button } from "@/contexts/frontend/design-system/atoms/Button";

import {
	createProductReview,
	type CreateProductReviewState,
} from "../../actions/reviews/createProductReview";

import styles from "./ProductReviews.module.scss";

const ratings = [5, 4, 3, 2, 1];

const initialState: CreateProductReviewState = { error: null };

type ProductReviewFormProps = {
	productId: string;
};

export function ProductReviewForm({ productId }: ProductReviewFormProps) {
	const [state, formAction, isPending] = useActionState(
		(previousState: CreateProductReviewState, formData: FormData) => {
			formData.set("id", crypto.randomUUID());

			return createProductReview(previousState, formData);
		},
		initialState,
	);

	return (
		<form action={formAction} className={styles.form}>
			<input type="hidden" name="productId" value={productId} />

			<fieldset className={styles.rating}>
				<legend className={styles.label}>Your rating</legend>
				<div className={styles.stars}>
					{ratings.map((rating) => (
						<label
							key={rating}
							className={styles.star}
							title={`${rating} out of 5`}
						>
							<input
								type="radio"
								name="rating"
								value={rating}
								required
								className={styles.starInput}
							/>
							<span aria-hidden="true">★</span>
							<span className={styles.visuallyHidden}>
								{rating} out of 5
							</span>
						</label>
					))}
				</div>
			</fieldset>

			<label className={styles.label} htmlFor="review-comment">
				Comment <span className={styles.optional}>(optional)</span>
			</label>
			<textarea
				id="review-comment"
				name="comment"
				rows={4}
				maxLength={1000}
				className={styles.textarea}
				placeholder="How does it fit? How does it feel?"
			/>

			{state.error ? (
				<p className={styles.error} role="alert">
					{state.error}
				</p>
			) : null}

			<div>
				<Button type="submit" isLoading={isPending}>
					Submit review
				</Button>
			</div>
		</form>
	);
}
