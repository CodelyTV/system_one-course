import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import { Badge } from "@/contexts/frontend/design-system/atoms/Badge";
import { Button } from "@/contexts/frontend/design-system/atoms/Button";
import { PageHeader } from "@/contexts/frontend/retail/sections/PageHeader";
import {
	formatMoney,
	formatStatus,
	variantLabel,
} from "@/contexts/frontend/retail/ui/format";

import { confirmOrder } from "../actions/checkout/confirmOrder";
import { removeCartLine } from "../actions/checkout/removeCartLine";

import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
	searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutPage({
	searchParams,
}: CheckoutPageProps) {
	const { order } = await searchParams;
	const checkout = await retailContainer.checkoutViewGetter.get();
	const isEmpty = checkout.lines.length === 0;

	return (
		<main>
			<PageHeader
				eyebrow="Checkout"
				title="Review and confirm your order."
				description="Review your cart, confirm home delivery and place your order."
			/>

			<section className={`container ${styles.layout}`}>
				<div className={styles.main}>
					{order ? (
						<div className={styles.confirmation} role="status">
							<p className={styles.confirmationTitle}>
								Order confirmed
							</p>
							<p className={styles.confirmationDetail}>
								Order <strong>{order}</strong> has been placed.
								Your cart is now empty.
							</p>
						</div>
					) : null}

					<article className={styles.card}>
						<div className={styles.cardHead}>
							<div>
								<p className="eyebrow">Order</p>
								<h2 className={styles.cardTitle}>
									Cart summary
								</h2>
							</div>
							<Badge color="alt-1">
								{formatStatus(checkout.status)}
							</Badge>
						</div>
						<div className={styles.lines}>
							{isEmpty ? (
								<div className={styles.empty}>
									<p className={styles.emptyTitle}>
										Your cart is empty
									</p>
									<p className={styles.emptyDetail}>
										Add a product from the catalog before
										checking out.
									</p>
								</div>
							) : (
								checkout.lines.map((line) => (
									<div
										key={line.variantId}
										className={styles.line}
									>
										<div>
											<p className={styles.lineName}>
												{line.productName}
											</p>
											<p className={styles.lineMeta}>
												{variantLabel(
													line.color,
													line.size,
												)}{" "}
												· Qty {line.quantity}
											</p>
										</div>
										<div className={styles.lineRight}>
											<p className={styles.lineTotal}>
												{formatMoney({
													amount:
														line.priceAmount *
														line.quantity,
													currency: "EUR",
												})}
											</p>
											<form action={removeCartLine}>
												<input
													type="hidden"
													name="variantId"
													value={line.variantId}
												/>
												<button
													type="submit"
													aria-label={`Remove ${line.productName} ${variantLabel(line.color, line.size)}`}
													className={styles.remove}
												>
													<svg
														aria-hidden="true"
														width="16"
														height="16"
														fill="none"
														stroke="currentColor"
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														viewBox="0 0 24 24"
													>
														<path d="M4 7h16" />
														<path d="M10 11v6" />
														<path d="M14 11v6" />
														<path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -13" />
														<path d="M9 7V4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
													</svg>
												</button>
											</form>
										</div>
									</div>
								))
							)}
						</div>
					</article>

					<article className={styles.card}>
						<p className="eyebrow">Delivery method</p>
						<h2 className={styles.cardTitle}>How it arrives</h2>
						<div className={styles.delivery}>
							<span
								className={styles.deliveryDot}
								aria-hidden="true"
							/>
							<div>
								<p className={styles.lineName}>Home delivery</p>
								<p className={styles.lineMeta}>
									Standard shipping to your home, with your
									stock already reserved.
								</p>
							</div>
						</div>
					</article>
				</div>

				<aside className={styles.summary}>
					<p className={styles.summaryEyebrow}>Checkout</p>
					<p className={styles.summaryTotal}>
						{formatMoney({
							amount: checkout.subtotalAmount,
							currency: "EUR",
						})}
					</p>
					<p className={styles.summaryDetail}>
						Order total before shipping. Payment is simulated.
					</p>
					<div className={styles.summaryActions}>
						<form action={confirmOrder}>
							<Button disabled={isEmpty} type="submit">
								Confirm order
							</Button>
						</form>
						<Button href="/" mode="inverted">
							Back to catalog
						</Button>
					</div>
				</aside>
			</section>
		</main>
	);
}
