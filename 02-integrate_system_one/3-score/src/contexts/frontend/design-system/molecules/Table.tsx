import React from "react";

import styles from "./Table.module.scss";

export type TableProps = { children: React.ReactElement };

export function Table({ children }: TableProps) {
	return <table className={styles.table}>{children}</table>;
}
