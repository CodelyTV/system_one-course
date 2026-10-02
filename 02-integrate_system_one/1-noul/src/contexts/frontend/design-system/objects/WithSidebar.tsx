import { classNames } from "../shared/classNames";

import styles from "./WithSidebar.module.scss";

export interface WithSidebarProps {
	sidebar: React.ReactNode;
	children: React.ReactNode;
	gap?: "large" | "medium" | "small";
}

export const WithSidebar = ({
	sidebar,
	gap = "large",
	children,
}: WithSidebarProps) => {
	return (
		<div
			className={classNames(
				styles.withSidebar,
				styles[`withSidebar--${gap}`],
			)}
		>
			<div>{children}</div>
			<div>{sidebar}</div>
		</div>
	);
};
