"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { classNames } from "@/contexts/frontend/design-system/shared/classNames";

import styles from "./MainNav.module.scss";

const collections = ["Architecture Drop", "Core Wardrobe", "Signal Series"];

export function MainNav() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const collection = searchParams.get("collection");
	const onCatalog = pathname === "/";

	const items = [
		{ label: "Catalog", href: "/", active: onCatalog && !collection },
		...collections.map((name) => ({
			label: name,
			href: `/?collection=${encodeURIComponent(name)}`,
			active: onCatalog && collection === name,
		})),
	];

	return (
		<nav className={styles.nav} aria-label="Collections">
			{items.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					data-label={item.label}
					aria-current={item.active ? "page" : undefined}
					className={classNames(styles.link, {
						[styles.active]: item.active,
					})}
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
