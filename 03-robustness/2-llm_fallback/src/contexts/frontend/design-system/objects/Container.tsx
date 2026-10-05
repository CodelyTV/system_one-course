import styles from "./Container.module.scss";

export interface ContainerProps {
	children: React.ReactNode;
	tag?: "div" | "section";
	ariaLabel?: string;
	ariaLabelledby?: string;
	id?: string;
}

export const Container = ({
	children,
	tag = "div",
	ariaLabel,
	ariaLabelledby,
	id,
}: ContainerProps) => {
	const Tag = tag;

	return (
		<Tag
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
			className={styles["container"]}
			id={id}
		>
			{children}
		</Tag>
	);
};
