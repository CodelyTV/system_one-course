import styles from "./MetricCard.module.scss";

type MetricCardProps = {
	label: string;
	value: string;
	detail: string;
	tone?: "green" | "violet" | "yellow" | "pink" | "neutral";
};

export function MetricCard({
	label,
	value,
	detail,
	tone = "green",
}: MetricCardProps) {
	return (
		<article className={`${styles.card} ${styles[tone]}`}>
			<p className={styles.label}>{label}</p>
			<p className={styles.value}>{value}</p>
			<p className={styles.detail}>{detail}</p>
		</article>
	);
}
