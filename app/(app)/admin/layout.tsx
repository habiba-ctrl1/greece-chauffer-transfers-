import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	return <AdminShell user={user}>{children}</AdminShell>;
}
