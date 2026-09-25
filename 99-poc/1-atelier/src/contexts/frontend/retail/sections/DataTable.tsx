import { Table } from "@/contexts/frontend/design-system/molecules/Table";

import styles from "./DataTable.module.scss";

type DataTableProps = {
	headers: string[];
	rows: string[][];
};

export function DataTable({ headers, rows }: DataTableProps) {
	return (
		<div className={styles.wrapper}>
			<Table>
				<>
					<thead>
						<tr>
							{headers.map((header) => (
								<th key={header}>{header}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.join("-")}>
								{row.map((cell, index) => (
									<td key={`${index}-${cell}`}>{cell}</td>
								))}
							</tr>
						))}
					</tbody>
				</>
			</Table>
		</div>
	);
}
