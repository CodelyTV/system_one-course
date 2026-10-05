import type {
	OrderResponse,
	OrdersLister,
} from "@/contexts/backend/orders/application/list/OrdersLister";
import type {
	LowStockLister,
	LowStockResponse,
} from "@/contexts/backend/products/application/low-stock/LowStockLister";

export type DashboardResponse = {
	revenueAmount: number;
	ordersCount: number;
	averageOrderAmount: number;
	lowStockCount: number;
	lowStock: LowStockResponse[];
	recentOrders: OrderResponse[];
};

export class DashboardGetter {
	constructor(
		private readonly ordersLister: OrdersLister,
		private readonly lowStockLister: LowStockLister,
	) {}

	async get(): Promise<DashboardResponse> {
		const [orders, lowStock] = await Promise.all([
			this.ordersLister.list(),
			this.lowStockLister.list(),
		]);

		const revenueAmount = orders.reduce(
			(total, order) => total + order.subtotalAmount,
			0,
		);
		const ordersCount = orders.length;
		const averageOrderAmount =
			ordersCount > 0 ? Math.round(revenueAmount / ordersCount) : 0;

		return {
			revenueAmount,
			ordersCount,
			averageOrderAmount,
			lowStockCount: lowStock.length,
			lowStock: lowStock.slice(0, 6),
			recentOrders: orders.slice(0, 5),
		};
	}
}
