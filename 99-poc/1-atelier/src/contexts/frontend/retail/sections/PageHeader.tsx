import type { ReactNode } from "react";

import { Heading } from "@/contexts/frontend/design-system/atoms/Heading";

import styles from "./PageHeader.module.scss";

type PageHeaderProps = {
	eyebrow: string;
	title: string;
	description: string;
	aside?: ReactNode;
	showUnderscore?: boolean;
};

export function PageHeader({
	eyebrow,
	title,
	description,
	aside,
	showUnderscore = false,
}: PageHeaderProps) {
	return (
		<section className={`container ${styles.header}`}>
			<div className={styles.intro}>
				<p className="eyebrow">{eyebrow}</p>
				<Heading
					level="h1"
					size="large"
					showUnderscore={showUnderscore}
				>
					{title}
				</Heading>
				<p className={styles.description}>{description}</p>
			</div>
			{aside ? <div className={styles.aside}>{aside}</div> : null}
		</section>
	);
}
