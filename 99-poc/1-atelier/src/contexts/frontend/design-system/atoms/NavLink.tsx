import { usePathname } from "next/navigation";
import React from "react";

import { classNames } from "../shared/classNames";

import { CodelyLink } from "./CodelyLink";

import styles from "./NavLink.module.scss";

export interface NavLinkProps {
	href: string;
	children: string;
	rel?: "follow" | "nofollow";
}

export const NavLink = ({
	children,
	href,
	rel = "follow",
	...props
}: NavLinkProps) => {
	const pathname = usePathname();
	const isActive = Boolean(
		pathname &&
		href &&
		(pathname === href || pathname.startsWith(`${href}/`)),
	);

	return (
		<CodelyLink
			href={href}
			className={classNames(styles.navlink, {
				[styles[`navlink--active`]]: isActive,
			})}
			rel={rel}
			{...props}
		>
			{children}
		</CodelyLink>
	);
};
