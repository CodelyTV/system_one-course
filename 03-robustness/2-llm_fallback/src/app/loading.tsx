import styles from "./status.module.scss";

export default function Loading() {
	return (
		<main className={`container ${styles.status}`} aria-busy="true">
			<p className="eyebrow">Loading</p>
			<h1 className={styles.title}>Getting the store ready…</h1>
		</main>
	);
}
