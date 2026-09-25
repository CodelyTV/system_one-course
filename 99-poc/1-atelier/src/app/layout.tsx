import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { retailContainer } from "@/contexts/backend/shared/infrastructure/RetailContainer";
import Brand from "@/contexts/frontend/design-system/icons/brand.svg";
import { CartLink } from "@/contexts/frontend/retail/sections/CartLink";
import { Footer } from "@/contexts/frontend/retail/sections/Footer";
import { MainNav } from "@/contexts/frontend/retail/sections/MainNav";
import { UserMenu } from "@/contexts/frontend/retail/sections/UserMenu";

import "@/contexts/frontend/design-system/index.scss";
import "./app.scss";
import styles from "./layout.module.scss";

export const metadata: Metadata = {
	title: "Codely Atelier",
	description: "Clean code, clean style. Codely's clothing store.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	const cartItemCount = await retailContainer.cartItemCounter.count();

	return (
		<html lang="en" translate="no">
			<body>
				<div className="app-shell">
					<header className={styles.header}>
						<div className={`container ${styles.bar}`}>
							<div className={styles.left}>
								<Link
									href="/"
									className={styles.brand}
									aria-label="Codely Atelier, home"
								>
									<Brand
										aria-hidden="true"
										className={styles.brandLogo}
									/>
									<span className={styles.brandName}>
										Atelier
									</span>
								</Link>
								<Suspense fallback={null}>
									<MainNav />
								</Suspense>
							</div>
							<div className={styles.actions}>
								<Suspense fallback={null}>
									<UserMenu />
								</Suspense>
								<span
									className={styles.divider}
									aria-hidden="true"
								/>
								<CartLink itemCount={cartItemCount} />
							</div>
						</div>
					</header>
					<div className={styles.content}>{children}</div>
					<Footer />
				</div>
			</body>
		</html>
	);
}
