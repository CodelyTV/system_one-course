import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import {
	DashboardGetter,
	type DashboardResponse,
} from "@/contexts/frontend/retail/application/dashboard/DashboardGetter";

export async function getDashboard(): Promise<DashboardResponse> {
	return new DashboardGetter(
		retailContainer.ordersLister,
		retailContainer.lowStockLister,
	).get();
}
