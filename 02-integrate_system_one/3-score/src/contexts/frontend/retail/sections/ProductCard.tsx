import Link from "next/link";

import type { ProductResponse } from "@/contexts/backend/products/application/ProductResponse";
import {
	Badge,
	type BadgeColor,
} from "@/contexts/frontend/design-system/atoms/Badge";

import { formatMoney } from "../ui/format";

import { ProductVisual } from "./ProductVisual";

import styles from "./ProductCard.module.scss";

type ProductCardProps = {
	product: ProductResponse;
	priority?: boolean;
};

function colorForBadge(badge: string): BadgeColor {
	if (badge === "Low stock") {
		return "alt-3";
	}

	if (badge === "Limited edition") {
		return "alt-4";
	}

	if (badge === "New") {
		return "alt-1";
	}

	return "neutral";
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
	const isSoldOut = product.totalOnlineStock === 0;

	return (
		<article className={styles.card}>
			<Link href={`/products/${product.id}`} className={styles.link}>
				<div className={styles.media}>
					<ProductVisual
						product={product}
						titleAs="h2"
						priority={priority}
					/>
					{product.badges.length > 0 ? (
						<div className={styles.badges}>
							{product.badges.map((badge) => (
								<Badge key={badge} color={colorForBadge(badge)}>
									{badge}
								</Badge>
							))}
						</div>
					) : null}
				</div>
				<div className={styles.body}>
					<div>
						<p className={styles.category}>{product.category}</p>
						<p className={styles.description}>
							{product.description}
						</p>
					</div>
					{product.colors.length > 0 ? (
						<div
							className={styles.swatches}
							aria-label={`${product.colors.length} colors`}
						>
							{product.colors.slice(0, 4).map((color) => (
								<span
									key={color.name}
									className={styles.swatch}
									style={{ backgroundColor: color.hex }}
									title={color.name}
								/>
							))}
							{product.colors.length > 4 ? (
								<span className={styles.swatchMore}>
									+{product.colors.length - 4}
								</span>
							) : null}
						</div>
					) : null}
					<div className={styles.footer}>
						<p className={styles.price}>
							{formatMoney(product.price)}
						</p>
						<p className={styles.stock}>
							{isSoldOut
								? "Sold out"
								: `${product.totalOnlineStock} in stock`}
						</p>
					</div>
				</div>
			</Link>
		</article>
	);
}
