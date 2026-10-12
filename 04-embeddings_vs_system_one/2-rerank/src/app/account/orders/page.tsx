import Link from "next/link";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import {
	formatDeliveryMethod,
	formatMoney,
	formatStatus,
} from "@/contexts/frontend/retail/ui/format";
import styles from "@/contexts/frontend/retail/ui/orderTable.module.scss";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

export default async function AccountOrdersPage() {
	const orders = (await retailContainer.userOrdersLister.list()).map(
		(order) => ({
			id: order.id,
			date: order.createdAt,
			status: formatStatus(order.status),
			deliveryMethod: formatDeliveryMethod(order.deliveryMethod),
			items: order.items,
			total: formatMoney({
				amount: order.subtotalAmount,
				currency: "EUR",
			}),
		}),
	);

	return (
		<div>
			<header className={styles.header}>
				<h1 className={styles.title}>My orders</h1>
				<p className={styles.subtitle}>
					{orders.length} orders placed.
				</p>
			</header>

			{orders.length === 0 ? (
				<p>You haven't placed any orders yet.</p>
			) : (
				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Order</th>
								<th>Date</th>
								<th>Delivery</th>
								<th>Units</th>
								<th>Status</th>
								<th className={styles.right}>Total</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((order) => (
								<tr key={order.id}>
									<td>
										<Link
											href={`/account/orders/${order.id}`}
											className={styles.link}
										>
											{order.id}
										</Link>
									</td>
									<td>
										{dateFormatter.format(
											new Date(order.date),
										)}
									</td>
									<td>{order.deliveryMethod}</td>
									<td>{order.items}</td>
									<td>
										<span className={styles.status}>
											{order.status}
										</span>
									</td>
									<td className={styles.right}>
										{order.total}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
