"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { SafeUser } from "@/lib/schema";

interface AdminShellProps {
	user: SafeUser;
	children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="admin-layout">
			<Sidebar
				user={user}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>
			<div className="admin-main">
				<Topbar
					user={user}
					onToggleMenu={() => setSidebarOpen((prev) => !prev)}
				/>
				<main className="admin-content">
					{children}
				</main>
			</div>
		</div>
	);
}
