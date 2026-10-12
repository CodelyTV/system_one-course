import { Button } from "@/contexts/frontend/design-system/atoms/Button";

import styles from "./status.module.scss";

export default function NotFound() {
	return (
		<main className={`container ${styles.status}`}>
			<p className="eyebrow">404</p>
			<h1 className={styles.title}>We couldn't find that page</h1>
			<p className={styles.detail}>
				The product or page you are looking for does not exist.
			</p>
			<div className={styles.actions}>
				<Button href="/">Back to catalog</Button>
			</div>
		</main>
	);
}
