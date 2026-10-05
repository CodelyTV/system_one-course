"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { classNames } from "@/contexts/frontend/design-system/shared/classNames";

import styles from "./AdminNav.module.scss";

const panels = [
	{ href: "/admin", label: "Overview", exact: true },
	{ href: "/admin/orders", label: "Orders", exact: false },
	{ href: "/admin/inventory", label: "Inventory", exact: false },
];

export function AdminNav() {
	const pathname = usePathname();

	return (
		<nav className={styles.nav} aria-label="Admin panels">
			{panels.map((panel) => {
				const isActive = panel.exact
					? pathname === panel.href
					: pathname.startsWith(panel.href);

				return (
					<Link
						key={panel.href}
						href={panel.href}
						aria-current={isActive ? "page" : undefined}
						className={classNames(styles.link, {
							[styles.active]: isActive,
						})}
					>
						{panel.label}
					</Link>
				);
			})}
		</nav>
	);
}
