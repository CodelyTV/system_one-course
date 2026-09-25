import type { ReactNode } from "react";

import { AdminNav } from "./AdminNav";

import styles from "./layout.module.scss";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<main className={`container ${styles.layout}`}>
			<aside className={styles.sidebar}>
				<p className="eyebrow">Admin</p>
				<p className={styles.sidebarTitle}>Operations</p>
				<p className={styles.sidebarHint}>
					Internal space to monitor the store.
				</p>
				<hr className={styles.divider} />
				<p className={`eyebrow ${styles.navLabel}`}>Panels</p>
				<AdminNav />
			</aside>
			<section className={styles.content}>{children}</section>
		</main>
	);
}
