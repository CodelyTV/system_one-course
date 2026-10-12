"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { classNames } from "@/contexts/frontend/design-system/shared/classNames";

import styles from "./AdminLink.module.scss";

export function AdminLink() {
	const pathname = usePathname();
	const active = pathname.startsWith("/admin");

	return (
		<Link
			href="/admin"
			data-label="Admin"
			aria-current={active ? "page" : undefined}
			className={classNames(styles.link, { [styles.active]: active })}
		>
			Admin
		</Link>
	);
}
