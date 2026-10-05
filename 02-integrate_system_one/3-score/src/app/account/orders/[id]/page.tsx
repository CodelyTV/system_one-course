import Link from "next/link";
import { notFound } from "next/navigation";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import {
	formatDeliveryMethod,
	formatMoney,
	formatStatus,
	variantLabel,
} from "@/contexts/frontend/retail/ui/format";
import styles from "@/contexts/frontend/retail/ui/orderTable.module.scss";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

export default async function AccountOrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [order, currentUserId] = await Promise.all([
		retailContainer.orderFinder.find(id),
		retailContainer.currentUserProvider.currentUserId(),
	]);

	if (!order || order.userId !== currentUserId.value) {
		notFound();
	}

	return (
		<div>
			<Link href="/account/orders" className={styles.back}>
				← My orders
			</Link>
			<header className={styles.header}>
				<h1 className={styles.title}>{order.id}</h1>
			</header>

			<div className={styles.summary}>
				<div className={styles.summaryItem}>
					<span className={styles.summaryLabel}>Date</span>
					<span className={styles.summaryValue}>
						{dateFormatter.format(new Date(order.createdAt))}
					</span>
				</div>
				<div className={styles.summaryItem}>
					<span className={styles.summaryLabel}>Delivery</span>
					<span className={styles.summaryValue}>
						{formatDeliveryMethod(order.deliveryMethod)}
					</span>
				</div>
				<div className={styles.summaryItem}>
					<span className={styles.summaryLabel}>Status</span>
					<span className={styles.summaryValue}>
						{formatStatus(order.status)}
					</span>
				</div>
				<div className={styles.summaryItem}>
					<span className={styles.summaryLabel}>Total</span>
					<span className={styles.summaryValue}>
						{formatMoney({
							amount: order.subtotalAmount,
							currency: "EUR",
						})}
					</span>
				</div>
			</div>

			<div className={styles.tableWrap}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Product</th>
							<th>Variant</th>
							<th>Units</th>
							<th className={styles.right}>Line total</th>
						</tr>
					</thead>
					<tbody>
						{order.lines.map((line) => (
							<tr
								key={`${line.productName}-${line.color}-${line.size}`}
							>
								<td>{line.productName}</td>
								<td>{variantLabel(line.color, line.size)}</td>
								<td>{line.quantity}</td>
								<td className={styles.right}>
									{formatMoney({
										amount:
											line.unitPriceAmount *
											line.quantity,
										currency: "EUR",
									})}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
