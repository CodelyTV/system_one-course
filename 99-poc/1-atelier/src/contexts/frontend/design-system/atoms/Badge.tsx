import React from "react";

import { classNames } from "../shared/classNames";

import styles from "./Badge.module.scss";

export type BadgeVariant = "subtle" | "outline" | "live";
export type BadgeColor = "neutral" | "alt-1" | "alt-2" | "alt-3" | "alt-4";
export type BadgeSize = "xs" | "sm";

export type RegularBadgeProps = {
	children: React.ReactNode;
	variant?: Exclude<BadgeVariant, "live">;
	color?: BadgeColor;
	size?: BadgeSize;
};

export type LiveBadgeProps = {
	children: React.ReactNode;
	variant: "live";
	size?: BadgeSize;
	color?: never;
};

export type BadgeProps = RegularBadgeProps | LiveBadgeProps;

export const Badge: React.FC<BadgeProps> = ({
	children,
	variant = "subtle",
	color = "neutral",
	size = "sm",
}) => {
	const variantClass =
		variant === "live"
			? styles["badge--live"]
			: styles[`badge--${variant}--${color}`];

	return (
		<span
			className={classNames(
				styles.badge,
				variantClass,
				styles[`badge--${size}`],
			)}
		>
			{children}
		</span>
	);
};
