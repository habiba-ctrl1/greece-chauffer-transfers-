import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export const metadata = {
	title: "Sign In — Greece Chauffeur Service",
	description: "Operations & dispatch admin portal sign in.",
};

export default async function LoginPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect("/admin/dashboard");
	}

	return (
		<main className="login-page">
			<div className="login-card">
				<div className="login-brand">
					<h1>Greece Chauffeur</h1>
					<p>Executive Transport & Dispatch Management</p>
				</div>
				<LoginForm />
			</div>
		</main>
	);
}
