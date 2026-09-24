"use client";

import Link from "next/link";

interface PrintToolbarProps {
	backHref: string;
	backLabel: string;
	title: string;
}

export function PrintToolbar({ backHref, backLabel, title }: PrintToolbarProps) {
	return (
		<div
			className="print-hide"
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				padding: "1rem 1.5rem",
				background: "var(--bg-surface)",
				border: "1px solid var(--border-default)",
				borderRadius: "var(--radius-md)",
				marginBottom: "1.5rem",
				boxShadow: "var(--shadow-sm)",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
				<Link href={backHref} className="btn btn-secondary btn-sm">
					← {backLabel}
				</Link>
				<span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{title}</span>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
				<button
					type="button"
					onClick={() => window.print()}
					className="btn btn-primary btn-sm allow-print"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem",
						fontWeight: 600,
					}}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<polyline points="6 9 6 2 18 2 18 9"></polyline>
						<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
						<rect x="6" y="14" width="12" height="8"></rect>
					</svg>
					Print / Save as PDF
				</button>
			</div>
		</div>
	);
}
