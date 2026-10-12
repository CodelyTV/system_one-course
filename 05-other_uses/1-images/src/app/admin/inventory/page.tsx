import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import { variantLabel } from "@/contexts/frontend/retail/ui/format";

import styles from "./inventory.module.scss";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
	const inventory = (await retailContainer.inventoryLister.list()).map(
		(row) => ({
			...row,
			variantLabel: variantLabel(row.color, row.size),
		}),
	);
	const lowCount = inventory.filter((row) => row.low).length;

	return (
		<div>
			<header className={styles.header}>
				<p className="eyebrow">Inventory</p>
				<h1 className={styles.title}>Inventory</h1>
				<p className={styles.subtitle}>
					{inventory.length} variants · {lowCount} with low stock.
				</p>
			</header>

			<div className={styles.tableWrap}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Product</th>
							<th>Collection</th>
							<th>Variant</th>
							<th className={styles.right}>Stock</th>
						</tr>
					</thead>
					<tbody>
						{inventory.map((row) => (
							<tr
								key={`${row.productName}-${row.variantLabel}`}
								className={row.low ? styles.lowRow : ""}
							>
								<td>{row.productName}</td>
								<td>{row.collection}</td>
								<td>{row.variantLabel}</td>
								<td className={styles.right}>
									<span
										className={
											row.low
												? styles.lowTag
												: styles.stock
										}
									>
										{row.stock}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
