"use client";

import React from "react";

import { classNames } from "../shared/classNames";

import { CodelyLink } from "./CodelyLink";
import { Icon } from "./Icon";

import styles from "./Button.module.scss";

type RequiredNotNull<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};

export type HtmlButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	href?: undefined;
};

export type AnchorProps = Partial<
	RequiredNotNull<
		Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children">
	>
> & {
	href: string;
};

export type AnchorWithComponentProps<T extends React.ElementType> =
	AnchorProps & {
		component: T;
		href: React.ComponentProps<T>["href"];
	} & Omit<React.ComponentPropsWithoutRef<T>, keyof AnchorProps>;

export type ButtonVariations =
	"inverted" | "primary" | "secondary" | "tertiary" | "quaternary" | "danger";

export interface ButtonProps {
	mode?: ButtonVariations;
	size?: "small" | "large" | "x-small";
	children: React.ReactNode;
	isLoading?: boolean;
}

export type ButtonPropsOverload<T extends React.ElementType> = ButtonProps &
	(HtmlButtonProps | AnchorProps | AnchorWithComponentProps<T>);

export const buttonPropsHasHref = <T extends React.ElementType>(
	props: AnchorProps | HtmlButtonProps | AnchorWithComponentProps<T>,
): props is AnchorProps | AnchorWithComponentProps<T> => "href" in props;

const buttonPropsHasComponent = <T extends React.ElementType>(
	props: AnchorProps | HtmlButtonProps | AnchorWithComponentProps<T>,
): props is AnchorWithComponentProps<T> => "component" in props;

export const Button = <T extends React.ElementType>({
	mode = "primary",
	size = "large",
	isLoading = false,
	children,
	...rest
}: ButtonPropsOverload<T>) => {
	let restProps: typeof rest = rest;
	let disabledFromProps: boolean | undefined;

	if (!buttonPropsHasHref(rest)) {
		const { disabled, ...withoutDisabled } = rest as HtmlButtonProps;
		disabledFromProps = disabled;
		restProps = withoutDisabled as typeof rest;
	}

	const isDisabled = isLoading || Boolean(disabledFromProps);

	const componentProps = {
		className: classNames(
			styles["btn"],
			styles[`btn--${mode}`],
			styles[`btn--${size}`],
			isLoading ? styles["btn--loading"] : undefined,
		),
		...restProps,
		...(buttonPropsHasHref(restProps) ? {} : { disabled: isDisabled }),
	};

	const content = (
		<>
			{isLoading && (
				<span className={styles["btn__spinner"]} aria-hidden="true">
					<Icon icon="load" size="small" />
				</span>
			)}
			{children}
		</>
	);

	if (buttonPropsHasComponent(componentProps)) {
		const { component: Component, ...rest } = componentProps;

		return <Component {...rest}>{content}</Component>;
	}

	if (buttonPropsHasHref(componentProps)) {
		return <CodelyLink {...componentProps}>{content}</CodelyLink>;
	}

	return <button {...componentProps}>{content}</button>;
};
