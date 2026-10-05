import React from "react";

import { classNames } from "../shared/classNames";

import { CodelyLink } from "./CodelyLink";
import { Icon, Icons } from "./Icon";

import styles from "./CircleIconButton.module.scss";

type HtmlButtonProps = Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	"children"
> & {
	href?: undefined;
};

type RequiredNotNull<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

type AnchorProps = Partial<
	RequiredNotNull<
		Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children">
	>
> & {
	href: string;
};

export interface CircleIconButtonProps {
	mode?: "dark" | "light";
	size?: "small" | "medium" | "large";
	label: string;
	icon: Icons;
}

interface Overload {
	(props: CircleIconButtonProps & HtmlButtonProps): React.JSX.Element;
	(props: AnchorProps & CircleIconButtonProps): React.JSX.Element;
}

const hasHref = (props: AnchorProps | HtmlButtonProps): props is AnchorProps =>
	"href" in props;

export const CircleIconButton: Overload = ({
	mode = "light",
	size = "medium",
	label,
	icon,
	...props
}) => {
	const buttonSize = size;
	const iconSize = buttonSize === "large" ? "large" : "medium";

	const componentProps = {
		"aria-label": label,
		...props,
	};

	componentProps.className = classNames(
		styles["icon-btn"],
		styles[`icon-btn--${mode}`],
		styles[`icon-btn--${buttonSize}`],
		componentProps.className,
	);

	if (hasHref(componentProps)) {
		return (
			<CodelyLink {...componentProps}>
				<Icon icon={icon} size={iconSize} />
			</CodelyLink>
		);
	}

	return (
		<button {...componentProps}>
			<Icon icon={icon} size={iconSize} />
		</button>
	);
};
