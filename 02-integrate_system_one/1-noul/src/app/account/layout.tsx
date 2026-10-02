import type { ReactNode } from "react";

import styles from "./layout.module.scss";

export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: ReactNode }) {
	return (
		<main className={`container ${styles.layout}`}>
			<p className="eyebrow">Mi cuenta</p>
			{children}
		</main>
	);
}
