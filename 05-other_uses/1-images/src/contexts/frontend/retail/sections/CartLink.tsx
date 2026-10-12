import { CodelyLink } from "@/contexts/frontend/design-system/atoms/CodelyLink";
import { Icon } from "@/contexts/frontend/design-system/atoms/Icon";

import styles from "./CartLink.module.scss";

export function CartLink({ itemCount }: { itemCount: number }) {
	const itemLabel = itemCount === 1 ? "item" : "items";

	return (
		<CodelyLink
			href="/checkout"
			aria-label={`Cart, ${itemCount} ${itemLabel}`}
			className={styles.cart}
		>
			<Icon icon="cart" size="small" />
			{itemCount > 0 ? (
				<span className={styles.count} aria-hidden="true">
					{itemCount}
				</span>
			) : null}
		</CodelyLink>
	);
}
