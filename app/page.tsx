import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Greece Chauffeur Service — Executive Transport Greece",
	description: "Luxury private transfers and chauffeur operations in Greece.",
};

export default async function HomePage() {
	const user = await getCurrentUser();

	return (
		<main
			style={{
				minHeight: "100dvh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #1a1d23 0%, #2c3038 60%, #1a1d23 100%)",
				color: "#ffffff",
				padding: "2rem",
				textAlign: "center",
			}}
		>
			<div
				style={{
					maxWidth: "560px",
					width: "100%",
					background: "rgba(255, 255, 255, 0.04)",
					backdropFilter: "blur(12px)",
					border: "1px solid rgba(255, 255, 255, 0.1)",
					borderRadius: "16px",
					padding: "3rem 2rem",
					boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
				}}
			>
				<div style={{ marginBottom: "1.5rem" }}>
					<span
						style={{
							display: "inline-block",
							background: "rgba(92, 124, 250, 0.15)",
							color: "#748ffc",
							fontSize: "0.75rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							padding: "0.375rem 0.75rem",
							borderRadius: "20px",
							border: "1px solid rgba(92, 124, 250, 0.3)",
							marginBottom: "1rem",
						}}
					>
						Executive Transport
					</span>
					<h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
						Greece Chauffeur
					</h1>
					<p style={{ color: "#adb5bd", fontSize: "0.9375rem", marginTop: "0.5rem" }}>
						Athens & Greece Premium Chauffeur & Dispatch Management System
					</p>
				</div>

				<div style={{ marginTop: "2rem" }}>
					{user ? (
						<Link
							href="/admin/dashboard"
							className="btn btn-primary btn-lg"
							style={{ width: "100%" }}
						>
							Go to Operations Dashboard →
						</Link>
					) : (
						<Link
							href="/login"
							className="btn btn-primary btn-lg"
							style={{ width: "100%" }}
						>
							Sign In to Operations Portal →
						</Link>
					)}
				</div>
			</div>

			<Link
				href="/api/health"
				style={{
					marginTop: "1.5rem",
					fontSize: "0.75rem",
					color: "rgba(255, 255, 255, 0.35)",
					textDecoration: "none",
				}}
			>
				System status
			</Link>
		</main>
	);
}
