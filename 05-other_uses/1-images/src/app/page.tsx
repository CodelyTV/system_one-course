import Form from "next/form";
import Link from "next/link";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import { Badge } from "@/contexts/frontend/design-system/atoms/Badge";
import { PageHeader } from "@/contexts/frontend/retail/sections/PageHeader";
import { ProductCard } from "@/contexts/frontend/retail/sections/ProductCard";

import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
	searchParams: Promise<{
		q?: string;
		collection?: string;
		category?: string;
	}>;
};

function catalogHref(
	query?: string,
	collection?: string,
	category?: string,
): string {
	const params = new URLSearchParams();

	if (query) {
		params.set("q", query);
	}

	if (collection) {
		params.set("collection", collection);
	}

	if (category) {
		params.set("category", category);
	}

	const queryString = params.toString();

	return queryString ? `/?${queryString}` : "/";
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
	const { q: query, collection, category } = await searchParams;
	const [products, categories] = await Promise.all([
		retailContainer.productsSearcher.search({
			query,
			collection,
			category,
		}),
		retailContainer.categoriesLister.list(),
	]);
	const totalStock = products.reduce(
		(total, product) => total + product.totalOnlineStock,
		0,
	);

	const filters = [
		{ label: "All", value: undefined },
		...categories.map((name) => ({ label: name, value: name })),
	];

	return (
		<main>
			<PageHeader
				showUnderscore
				eyebrow={collection ? "Collection" : "Codely Atelier"}
				title={collection ?? "Clean code, pro style"}
				description={
					collection
						? `All the best of the ${collection} collection, with no technical debt.`
						: "Production-ready garments, with no legacy seams. Pick a color and size, and we deploy straight to your wardrobe."
				}
				aside={
					<div className={styles.summary}>
						<Badge color="alt-1">Active collection</Badge>
						<p className={styles.summaryCount}>
							{products.length} products
						</p>
						<p className={styles.summaryDetail}>
							{totalStock} units ready to ship.
						</p>
					</div>
				}
			/>

			<section className={`container ${styles.section}`}>
				<div className={styles.toolbar}>
					<div>
						<p className="eyebrow">Catalog</p>
						<h2 className={styles.heading}>
							Explore the collection
						</h2>
					</div>
					<Form
						role="search"
						action="/"
						scroll={false}
						className={styles.search}
					>
						<input
							type="search"
							name="q"
							defaultValue={query}
							placeholder="Search products"
							aria-label="Search products"
							className={styles.searchInput}
						/>
						{collection && (
							<input
								type="hidden"
								name="collection"
								value={collection}
							/>
						)}
						{category && (
							<input
								type="hidden"
								name="category"
								value={category}
							/>
						)}
						<button type="submit" className={styles.searchButton}>
							Search
						</button>
					</Form>
					<nav
						className={styles.filters}
						aria-label="Filter by garment type"
					>
						{filters.map((filter) => {
							const isActive =
								(filter.value ?? undefined) ===
								(category ?? undefined);

							return (
								<Link
									key={filter.label}
									href={catalogHref(
										query,
										collection,
										filter.value,
									)}
									aria-current={isActive ? "page" : undefined}
									className={`${styles.filter} ${isActive ? styles.filterActive : ""}`}
								>
									{filter.label}
								</Link>
							);
						})}
					</nav>
				</div>

				{products.length === 0 ? (
					<p className={styles.empty}>
						{query
							? `There are no products similar to "${query}".`
							: "There are no products in this collection yet."}
					</p>
				) : (
					<div className={styles.grid}>
						{products.map((product, index) => (
							<ProductCard
								key={product.id}
								product={product}
								priority={index === 0}
							/>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
