import React from "react";

import { Heading } from "../atoms/Heading";
import { classNames } from "../shared/classNames";

import styles from "./PageHeader.module.scss";

export interface PageHeaderProps {
	title: string;
	children: React.ReactNode;
	headingId?: string;
	enableFullWidthToAvoidLayoutShift?: boolean;
}

export const PageHeader = ({
	title,
	children,
	headingId,
	enableFullWidthToAvoidLayoutShift = false,
}: PageHeaderProps) => {
	const headingIdOnlyIfReceived =
		headingId !== undefined ? { id: headingId } : {};

	return (
		<header
			className={classNames(styles.header, {
				[styles["header--fullWidth"]]:
					enableFullWidthToAvoidLayoutShift,
			})}
		>
			<Heading level="h1" size="large" {...headingIdOnlyIfReceived}>
				{title}
			</Heading>
			{children}
		</header>
	);
};
