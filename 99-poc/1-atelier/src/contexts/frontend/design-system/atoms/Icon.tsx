import React from "react";

import * as icons from "../icons/icons";
import { classNames } from "../shared/classNames";

import styles from "./Icon.module.scss";

export type Icons = keyof typeof icons;
export interface IconProps {
	icon: Icons;
	size?: "small" | "medium" | "large" | "xl";
	color?: string;
}

function getIcon(
	iconKey: Icons,
	color?: string,
): React.ReactElement<typeof IconComponent> {
	const IconComponent = icons[iconKey];

	return <IconComponent color={color} />;
}

export const Icon = ({ size = "medium", icon, color, ...props }: IconProps) => {
	return (
		<span
			className={classNames(styles["icon"], styles[`icon--${size}`])}
			{...props}
		>
			{getIcon(icon, color)}
		</span>
	);
};
