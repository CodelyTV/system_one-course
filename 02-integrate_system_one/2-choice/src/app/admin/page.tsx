import Link from "next/link";

import { lowStockThreshold } from "@/contexts/backend/products/domain/ProductVariant";
import { MetricCard } from "@/contexts/frontend/retail/sections/MetricCard";
import {
	formatMoney,
	variantLabel,
} from "@/contexts/frontend/retail/ui/format";

import { getDashboard } from "../actions/admin/getDashboard";

import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

const tones = ["green", "violet", "yellow", "pink", "neutral"] as const;
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
});

export default async function AdminDashboardPage() {
	const dashboard = await getDashboard();

	const metrics = [
		{
			label: "Revenue",
			value: formatMoney({
				amount: dashboard.revenueAmount,
				currency: "EUR",
			}),
			detail: "Confirmed orders",
		},
		{
			label: "Orders",
			value: String(dashboard.ordersCount),
			detail: "Total confirmed",
		},
		{
			label: "Average order",
			value: formatMoney({
				amount: dashboard.averageOrderAmount,
				currency: "EUR",
			}),
			detail: "Per order",
		},
		{
			label: "Low stock",
			value: String(dashboard.lowStockCount),
			detail: `${lowStockThreshold} units or fewer`,
		},
	];

	const lowStock = dashboard.lowStock.map((item) => ({
		productName: item.productName,
		variantLabel: variantLabel(item.color, item.size),
		stock: item.stock,
	}));

	const recentOrders = dashboard.recentOrders.map((order) => ({
		id: order.id,
		date: order.createdAt,
		total: formatMoney({ amount: order.subtotalAmount, currency: "EUR" }),
		items: order.items,
	}));

	return (
		<div>
			<header className={styles.header}>
				<p className="eyebrow">Overview</p>
				<h1 className={styles.title}>Operations at a glance</h1>
				<p className={styles.subtitle}>
					How the store is doing: catalog, stock and orders at a
					glance.
				</p>
			</header>

			<section className={styles.metrics}>
				{metrics.map((metric, index) => (
					<MetricCard
						key={metric.label}
						label={metric.label}
						value={metric.value}
						detail={metric.detail}
						tone={tones[index % tones.length]}
					/>
				))}
			</section>

			<section className={styles.panels}>
				<article className={styles.panel}>
					<div className={styles.panelHead}>
						<h2 className={styles.panelTitle}>Low stock</h2>
						<Link
							href="/admin/inventory"
							className={styles.panelLink}
						>
							View inventory
						</Link>
					</div>
					{lowStock.length === 0 ? (
						<p className={styles.panelEmpty}>No stock alerts.</p>
					) : (
						<ul className={styles.list}>
							{lowStock.map((item) => (
								<li
									key={`${item.productName}-${item.variantLabel}`}
									className={styles.listRow}
								>
									<span>
										<span className={styles.listName}>
											{item.productName}
										</span>
										<span className={styles.listMeta}>
											{item.variantLabel}
										</span>
									</span>
									<span className={styles.stockTag}>
										{item.stock} units
									</span>
								</li>
							))}
						</ul>
					)}
				</article>

				<article className={styles.panel}>
					<div className={styles.panelHead}>
						<h2 className={styles.panelTitle}>Latest orders</h2>
						<Link href="/admin/orders" className={styles.panelLink}>
							View orders
						</Link>
					</div>
					{recentOrders.length === 0 ? (
						<p className={styles.panelEmpty}>No orders yet.</p>
					) : (
						<ul className={styles.list}>
							{recentOrders.map((order) => (
								<li key={order.id} className={styles.listRow}>
									<span>
										<Link
											href={`/admin/orders/${order.id}`}
											className={styles.listName}
										>
											{order.id}
										</Link>
										<span className={styles.listMeta}>
											{dateFormatter.format(
												new Date(order.date),
											)}{" "}
											· {order.items} units
										</span>
									</span>
									<span className={styles.listValue}>
										{order.total}
									</span>
								</li>
							))}
						</ul>
					)}
				</article>
			</section>
		</div>
	);
}
