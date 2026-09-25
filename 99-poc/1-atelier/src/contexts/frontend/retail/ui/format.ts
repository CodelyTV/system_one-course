import type { MoneyPrimitives } from "@/contexts/shared/domain/Money";

export function formatMoney(money: MoneyPrimitives): string {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: money.currency,
		maximumFractionDigits: 0,
	}).format(money.amount);
}

const statusLabels: Record<string, string> = {
	confirmed: "Confirmed",
	draft: "Draft",
};

const deliveryLabels: Record<string, string> = {
	"home-delivery": "Home delivery",
	"store-pickup": "Store pickup",
};

export function formatStatus(status: string): string {
	return statusLabels[status] ?? status;
}

export function formatDeliveryMethod(deliveryMethod: string): string {
	return deliveryLabels[deliveryMethod] ?? deliveryMethod;
}

export function variantLabel(color: string, size: string): string {
	return `${color} / ${size}`;
}
