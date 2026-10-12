"use client";

import { useMemo, useState } from "react";

import type { ProductResponse } from "@/contexts/backend/products/application/ProductResponse";
import { Button } from "@/contexts/frontend/design-system/atoms/Button";

import { addSelectedVariantToCart } from "../../actions/checkout/addSelectedVariantToCart";

import styles from "./ProductPurchasePanel.module.scss";

type ProductPurchasePanelProps = {
	initialVariantId: string;
	product: ProductResponse;
};

export function ProductPurchasePanel({
	initialVariantId,
	product,
}: ProductPurchasePanelProps) {
	const [selectedVariantId, setSelectedVariantId] =
		useState(initialVariantId);
	const selectedVariant =
		product.variants.find((variant) => variant.id === selectedVariantId) ??
		product.variants[0];
	const colorOptions = Array.from(
		new Set(product.variants.map((variant) => variant.color)),
	);
	const sizeOptions = product.variants.filter(
		(variant) => variant.color === selectedVariant.color,
	);
	const selectedVariantHasStock = selectedVariant.onlineStock > 0;

	const colorAvailability = useMemo(
		() =>
			new Map(
				colorOptions.map((color) => [
					color,
					product.variants.some(
						(variant) =>
							variant.color === color && variant.onlineStock > 0,
					),
				]),
			),
		[colorOptions, product.variants],
	);

	function selectColor(color: string) {
		const nextVariant =
			product.variants.find(
				(variant) =>
					variant.color === color &&
					variant.size === selectedVariant.size &&
					variant.onlineStock > 0,
			) ??
			product.variants.find(
				(variant) => variant.color === color && variant.onlineStock > 0,
			) ??
			product.variants.find((variant) => variant.color === color);

		if (nextVariant) {
			setSelectedVariantId(nextVariant.id);
		}
	}

	return (
		<>
			<div className={styles.options}>
				<div>
					<p className={styles.optionLabel} id="color-label">
						Color:{" "}
						<span className={styles.optionValue}>
							{selectedVariant.color}
						</span>
					</p>
					<div
						className={styles.swatches}
						role="group"
						aria-labelledby="color-label"
					>
						{product.colors.map((color) => {
							const hasStock =
								colorAvailability.get(color.name) ?? false;
							const isSelected =
								color.name === selectedVariant.color;

							return (
								<button
									type="button"
									key={color.name}
									aria-pressed={isSelected}
									aria-label={`${color.name}${hasStock ? "" : ", sold out"}`}
									title={color.name}
									disabled={!hasStock}
									onClick={() => selectColor(color.name)}
									className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ""}`}
									style={{ backgroundColor: color.hex }}
								/>
							);
						})}
					</div>
				</div>

				<div>
					<p className={styles.optionLabel} id="size-label">
						Size
					</p>
					<div
						className={styles.sizes}
						role="group"
						aria-labelledby="size-label"
					>
						{sizeOptions.map((variant) => {
							const isSelected =
								variant.id === selectedVariant.id;

							return (
								<button
									type="button"
									key={variant.id}
									aria-pressed={isSelected}
									aria-label={`Size ${variant.size}${variant.onlineStock === 0 ? ", sold out" : ""}`}
									disabled={variant.onlineStock === 0}
									onClick={() =>
										setSelectedVariantId(variant.id)
									}
									className={`${styles.choice} ${isSelected ? styles.choiceSelected : ""}`}
								>
									{variant.size}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			<div className={styles.variant}>
				<p className={styles.variantTitle}>Selected variant</p>
				<p className={styles.variantDetail}>
					{selectedVariant.color} / {selectedVariant.size}. Online
					stock: {selectedVariant.onlineStock}
				</p>
				<p className={styles.variantDetail}>
					Measurements: chest {selectedVariant.measurements.chest} cm,
					length {selectedVariant.measurements.length} cm.
				</p>
			</div>

			<div className={styles.actions}>
				<form action={addSelectedVariantToCart}>
					<input
						type="hidden"
						name="variantId"
						value={selectedVariant.id}
					/>
					<Button type="submit" disabled={!selectedVariantHasStock}>
						{selectedVariantHasStock ? "Add to cart" : "Sold out"}
					</Button>
				</form>
				<Button href="/" mode="quaternary">
					Back to catalog
				</Button>
			</div>
		</>
	);
}
