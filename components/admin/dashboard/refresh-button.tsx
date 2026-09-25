"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [justRefreshed, setJustRefreshed] = useState(false);

	function handleClick() {
		startTransition(() => {
			router.refresh();
		});
		setJustRefreshed(true);
		setTimeout(() => setJustRefreshed(false), 1500);
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className="btn btn-secondary btn-sm"
			disabled={isPending}
			aria-label="Refresh dashboard data"
		>
			<svg
				viewBox="0 0 24 24"
				width="14"
				height="14"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				style={{
					animation: isPending ? "spin 0.8s linear infinite" : undefined,
				}}
			>
				<polyline points="23 4 23 10 17 10"></polyline>
				<polyline points="1 20 1 14 7 14"></polyline>
				<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
			</svg>
			<span>{isPending ? "Refreshing…" : justRefreshed ? "Updated" : "Refresh"}</span>
			<style>{`
				@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
				@media (prefers-reduced-motion: reduce) {
					button svg { animation: none !important; }
				}
			`}</style>
		</button>
	);
}
