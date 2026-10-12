import Link from "next/link";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import {
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

export default async function AdminOrdersPage() {
	const orders = (await retailContainer.ordersLister.list()).map((order) => ({
		id: order.id,
		date: order.createdAt,
		status: formatStatus(order.status),
		customerName: order.customerName,
		items: order.items,
		total: formatMoney({ amount: order.subtotalAmount, currency: "EUR" }),
	}));

	return (
		<div>
			<header className={styles.header}>
				<p className="eyebrow">Orders</p>
				<h1 className={styles.title}>Orders</h1>
				<p className={styles.subtitle}>
					{orders.length} confirmed orders.
				</p>
			</header>

			<div className={styles.tableWrap}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Order</th>
							<th>Customer</th>
							<th>Date</th>
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
										href={`/admin/orders/${order.id}`}
										className={styles.link}
									>
										{order.id}
									</Link>
								</td>
								<td>{order.customerName}</td>
								<td>
									{dateFormatter.format(new Date(order.date))}
								</td>
								<td>{order.items}</td>
								<td>
									<span className={styles.status}>
										{order.status}
									</span>
								</td>
								<td className={styles.right}>{order.total}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
