import { describe, expect, it } from "vitest";

import {
	formatDeliveryMethod,
	formatMoney,
	formatStatus,
	variantLabel,
} from "@/contexts/frontend/retail/ui/format";

describe("format", () => {
	it("formats euro amounts without decimals", () => {
		expect(formatMoney({ amount: 89, currency: "EUR" })).toBe("€89");
	});

	it("rounds decimal amounts to whole euros", () => {
		expect(formatMoney({ amount: 89.49, currency: "EUR" })).toBe("€89");
	});

	it("translates known status and delivery codes", () => {
		expect(formatStatus("confirmed")).toBe("Confirmed");
		expect(formatDeliveryMethod("home-delivery")).toBe("Home delivery");
	});

	it("builds the variant label from color and size", () => {
		expect(variantLabel("Black", "M")).toBe("Black / M");
	});
});
