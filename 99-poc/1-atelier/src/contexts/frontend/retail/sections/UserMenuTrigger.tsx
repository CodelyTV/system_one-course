"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AdminLink } from "./AdminLink";

import styles from "./UserMenu.module.scss";

function initials(name: string): string {
	return name
		.split(" ")
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function UserMenuTrigger({
	name,
	email,
}: {
	name: string;
	email: string;
}) {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: PointerEvent) {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	return (
		<div className={styles.menu} ref={menuRef}>
			<button
				type="button"
				className={styles.trigger}
				aria-label={`${name}'s account`}
				aria-expanded={open}
				onClick={() => setOpen((value) => !value)}
			>
				<span className={styles.avatar} aria-hidden="true">
					{initials(name)}
				</span>
			</button>
			{open ? (
				<div className={styles.panel}>
					<p className={styles.name}>{name}</p>
					<p className={styles.email}>{email}</p>
					<nav className={styles.links}>
						<Link
							href="/account/orders"
							className={styles.link}
							onClick={() => setOpen(false)}
						>
							My orders
						</Link>
						<AdminLink />
					</nav>
				</div>
			) : null}
		</div>
	);
}
