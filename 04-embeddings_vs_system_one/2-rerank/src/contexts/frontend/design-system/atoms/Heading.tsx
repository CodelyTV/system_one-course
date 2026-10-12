import React from "react";

import { classNames } from "../shared/classNames";

import styles from "./Heading.module.scss";

export interface HeadingProps {
	level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
	size?: "small" | "medium" | "large";
	showUnderscore?: boolean;
	id?: string;
	children: React.ReactNode;
	className?: string;
}

export const Heading = ({
	children,
	level = "h1",
	size = "medium",
	showUnderscore = false,
	className = "",
	id,
	...props
}: HeadingProps) => {
	const Tag = level;

	return (
		<Tag
			id={id}
			className={classNames(
				styles.heading,
				styles[`heading--${size}`],
				className,
			)}
			{...props}
		>
			<>
				{children}
				{showUnderscore && (
					<span className={styles.heading__deco} aria-hidden="true">
						_
					</span>
				)}
			</>
		</Tag>
	);
};
