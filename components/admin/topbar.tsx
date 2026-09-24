"use client";

import { usePathname } from "next/navigation";
import type { SafeUser } from "@/lib/schema";

interface TopbarProps {
	user: SafeUser;
	onToggleMenu: () => void;
}

const TITLE_MAP: Record<string, string> = {
	"/admin/dashboard": "Operations Dashboard",
	"/admin/bookings": "Booking Dispatch",
	"/admin/calendar": "Schedule Calendar",
	"/admin/quotes": "Quotations",
	"/admin/customers": "Customer Directory",
	"/admin/drivers": "Driver Roster",
	"/admin/vehicles": "Fleet Management",
	"/admin/payments": "Payment Tracking",
	"/admin/invoices": "Invoicing",
	"/admin/routes": "Routes & Pricing",
	"/admin/emails": "Email Communications",
	"/admin/activity-log": "System Activity Log",
	"/admin/settings": "Settings & Configuration",
};

export function Topbar({ user, onToggleMenu }: TopbarProps) {
	const pathname = usePathname();

	const title = TITLE_MAP[pathname] || "Admin Portal";

	return (
		<header className="topbar">
			<div className="topbar-left">
				<button
					type="button"
					className="menu-toggle"
					onClick={onToggleMenu}
					aria-label="Toggle navigation menu"
				>
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
				<h1 className="topbar-title">{title}</h1>
			</div>

			<div className="topbar-right">
				<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
					<span className="badge badge-success">Live Operations</span>
					<span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
						{user.email}
					</span>
				</div>
			</div>
		</header>
	);
}
