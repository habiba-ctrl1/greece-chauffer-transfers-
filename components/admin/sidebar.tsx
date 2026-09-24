"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import type { SafeUser } from "@/lib/schema";

interface SidebarProps {
	user: SafeUser;
	isOpen: boolean;
	onClose: () => void;
}

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
}

interface NavSection {
	title: string;
	items: NavItem[];
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
	const pathname = usePathname();

	const navSections: NavSection[] = [
		{
			title: "Operations",
			items: [
				{
					label: "Dashboard",
					href: "/admin/dashboard",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="3" y="3" width="7" height="7"></rect>
							<rect x="14" y="3" width="7" height="7"></rect>
							<rect x="14" y="14" width="7" height="7"></rect>
							<rect x="3" y="14" width="7" height="7"></rect>
						</svg>
					),
				},
				{
					label: "Bookings",
					href: "/admin/bookings",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
							<circle cx="7" cy="17" r="2"></circle>
							<path d="M9 17h6"></path>
							<circle cx="17" cy="17" r="2"></circle>
						</svg>
					),
				},
				{
					label: "Calendar",
					href: "/admin/calendar",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="16" y1="2" x2="16" y2="6"></line>
							<line x1="8" y1="2" x2="8" y2="6"></line>
							<line x1="3" y1="10" x2="21" y2="10"></line>
						</svg>
					),
				},
				{
					label: "Quotes",
					href: "/admin/quotes",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14 2 14 8 20 8"></polyline>
							<line x1="16" y1="13" x2="8" y2="13"></line>
							<line x1="16" y1="17" x2="8" y2="17"></line>
							<polyline points="10 9 9 9 8 9"></polyline>
						</svg>
					),
				},
			],
		},
		{
			title: "Fleet & Directory",
			items: [
				{
					label: "Customers",
					href: "/admin/customers",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
							<circle cx="9" cy="7" r="4"></circle>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
						</svg>
					),
				},
				{
					label: "Drivers",
					href: "/admin/drivers",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="7" r="4"></circle>
							<path d="M5.5 21a8.38 8.38 0 0 1 13 0"></path>
							<line x1="12" y1="11" x2="12" y2="17"></line>
						</svg>
					),
				},
				{
					label: "Vehicles",
					href: "/admin/vehicles",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
							<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
						</svg>
					),
				},
			],
		},
		{
			title: "Financials",
			items: [
				{
					label: "Payments",
					href: "/admin/payments",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
							<line x1="1" y1="10" x2="23" y2="10"></line>
						</svg>
					),
				},
				{
					label: "Invoices",
					href: "/admin/invoices",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"></path>
							<line x1="8" y1="8" x2="16" y2="8"></line>
							<line x1="8" y1="12" x2="16" y2="12"></line>
						</svg>
					),
				},
				{
					label: "Routes & Pricing",
					href: "/admin/routes",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="6" cy="19" r="3"></circle>
							<path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H5a4 4 0 0 1 0-8h11.5"></path>
							<circle cx="18" cy="5" r="3"></circle>
						</svg>
					),
				},
			],
		},
		{
			title: "System",
			items: [
				{
					label: "Emails",
					href: "/admin/emails",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
							<polyline points="22,6 12,13 2,6"></polyline>
						</svg>
					),
				},
				{
					label: "Activity Log",
					href: "/admin/activity-log",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 14 14"></polyline>
						</svg>
					),
				},
				{
					label: "Settings",
					href: "/admin/settings",
					icon: (
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="3"></circle>
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
						</svg>
					),
				},
			],
		},
	];

	const initial = (user.name || "A").charAt(0).toUpperCase();

	return (
		<>
			<div
				className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
				onClick={onClose}
				aria-hidden="true"
			/>
			<aside className={`sidebar ${isOpen ? "open" : ""}`}>
				<div className="sidebar-brand">
					<h2>Greece <span>Chauffeur</span></h2>
				</div>

				<nav className="sidebar-nav">
					{navSections.map((sec) => (
						<div key={sec.title} className="sidebar-section">
							<div className="sidebar-section-label">{sec.title}</div>
							{sec.items.map((item) => {
								const isActive =
									pathname === item.href ||
									(item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={onClose}
										className={`sidebar-link ${isActive ? "active" : ""}`}
									>
										{item.icon}
										<span>{item.label}</span>
									</Link>
								);
							})}
						</div>
					))}
				</nav>

				<div className="sidebar-footer">
					<div className="sidebar-user">
						<div className="sidebar-avatar">{initial}</div>
						<div className="sidebar-user-info">
							<div className="sidebar-user-name">{user.name}</div>
							<div className="sidebar-user-role">{user.role.replace("_", " ")}</div>
						</div>
					</div>
					<form action={logoutAction} style={{ marginTop: "0.5rem" }}>
						<button type="submit" className="logout-btn">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
								<polyline points="16 17 21 12 16 7"></polyline>
								<line x1="21" y1="12" x2="9" y2="12"></line>
							</svg>
							<span>Sign Out</span>
						</button>
					</form>
				</div>
			</aside>
		</>
	);
}
