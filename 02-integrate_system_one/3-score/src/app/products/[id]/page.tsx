import { notFound } from "next/navigation";

import { sizeOrder } from "@/contexts/backend/products/domain/ProductVariant";
import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import { Badge } from "@/contexts/frontend/design-system/atoms/Badge";
import { ProductCard } from "@/contexts/frontend/retail/sections/ProductCard";
import { ProductVisual } from "@/contexts/frontend/retail/sections/ProductVisual";
import { formatMoney } from "@/contexts/frontend/retail/ui/format";

import { ProductPurchasePanel } from "./ProductPurchasePanel";
import { ProductReviews } from "./ProductReviews";

import styles from "./page.module.scss";

type ProductPageProps = {
	params: Promise<{ id: string }>;
};

type SizeGuideRow = { size: string; chest: number; length: number };

function buildSizeGuide(
	variants: {
		size: string;
		measurements: { chest: number; length: number };
	}[],
): SizeGuideRow[] {
	const rows: SizeGuideRow[] = [];

	for (const size of sizeOrder) {
		const variant = variants.find((candidate) => candidate.size === size);

		if (variant) {
			rows.push({
				size,
				chest: variant.measurements.chest,
				length: variant.measurements.length,
			});
		}
	}

	return rows;
}

async function relatedProducts(productId: string, collection: string) {
	const all = await retailContainer.productsSearcher.search();
	const sameCollection = all.filter(
		(product) =>
			product.id !== productId && product.collection === collection,
	);
	const others = all.filter(
		(product) =>
			product.id !== productId && product.collection !== collection,
	);

	return [...sameCollection, ...others].slice(0, 4);
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: ProductPageProps) {
	const { id } = await params;
	const product = await retailContainer.productFinder.find(id);

	if (!product) {
		notFound();
	}

	const selectedVariantId = product.firstAvailableVariantId;
	const sizeGuide = buildSizeGuide(product.variants);
	const [related, reviews] = await Promise.all([
		relatedProducts(product.id, product.collection),
		retailContainer.allProductReviewsSearcher.search(product.id),
	]);

	return (
		<main className={`container ${styles.main}`}>
			<div className="page-grid">
				<div className={styles.media}>
					<ProductVisual product={product} size="hero" priority />

					<div className={styles.info}>
						<details className={styles.infoItem}>
							<summary className={styles.infoSummary}>
								More details
							</summary>
							<div className={styles.infoBody}>
								<p>
									Main fabric is medium-weight cotton.
									Designed in A Coruña.
								</p>
								<p>
									Machine wash cold, do not tumble dry. Iron
									inside out.
								</p>
							</div>
						</details>
						<details className={styles.infoItem}>
							<summary className={styles.infoSummary}>
								Size guide
							</summary>
							<div className={styles.infoBody}>
								<table className={styles.sizeTable}>
									<thead>
										<tr>
											<th>Size</th>
											<th>Chest (cm)</th>
											<th>Length (cm)</th>
										</tr>
									</thead>
									<tbody>
										{sizeGuide.map((row) => (
											<tr key={row.size}>
												<td>{row.size}</td>
												<td>{row.chest}</td>
												<td>{row.length}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</details>
						<details className={styles.infoItem}>
							<summary className={styles.infoSummary}>
								Shipping and returns
							</summary>
							<div className={styles.infoBody}>
								<p>Home delivery in 2-4 business days.</p>
								<p>
									Free returns within 30 days if it's not for
									you.
								</p>
							</div>
						</details>
					</div>
				</div>

				<section className={styles.details}>
					<p className="eyebrow">{product.collection}</p>
					<h1 className={styles.name}>{product.name}</h1>
					<p className={styles.description}>{product.description}</p>

					<div className={styles.badges}>
						{product.badges.map((badge) => (
							<Badge
								key={badge}
								color={
									badge === "Limited edition"
										? "alt-4"
										: "alt-1"
								}
							>
								{badge}
							</Badge>
						))}
					</div>

					<p className={styles.price}>{formatMoney(product.price)}</p>

					<ProductPurchasePanel
						initialVariantId={selectedVariantId}
						product={product}
					/>
				</section>
			</div>

			<ProductReviews productId={product.id} reviews={reviews} />

			{related.length > 0 ? (
				<section className={styles.related}>
					<p className="eyebrow">Collection</p>
					<h2 className={styles.sectionHeading}>
						You might also like
					</h2>
					<div className={styles.relatedGrid}>
						{related.map((item) => (
							<ProductCard key={item.id} product={item} />
						))}
					</div>
				</section>
			) : null}
		</main>
	);
}
