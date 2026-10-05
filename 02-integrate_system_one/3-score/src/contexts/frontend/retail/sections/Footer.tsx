import Link from "next/link";

import Brand from "@/contexts/frontend/design-system/icons/brand.svg";

import styles from "./Footer.module.scss";

export function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className={styles.footer}>
			<div className={`container ${styles.inner}`}>
				<div className={styles.brandBlock}>
					<Brand aria-hidden="true" className={styles.logo} />
					<p className={styles.tagline}>
						Solid clothing for people who keep their code (and their
						wardrobe) clean.
					</p>
				</div>
				<nav className={styles.links} aria-label="Footer">
					<Link href="/">Catalog</Link>
					<Link href="/checkout">Checkout</Link>
					<Link href="/admin">Admin</Link>
				</nav>
			</div>
			<div className={`container ${styles.legal}`}>
				<span>© {year} Codely Atelier</span>
				<span>Made with the Codely design system</span>
			</div>
		</footer>
	);
}
