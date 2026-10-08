import Link from "next/link";
import { notFound } from "next/navigation";
import { getDriverById } from "@/lib/actions/drivers";
import { DriverForm } from "@/components/admin/driver-form";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Edit Driver — Greece Chauffeur Service",
};

interface EditDriverPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
	const { id } = await params;
	const driver = await getDriverById(id);

	if (!driver) {
		notFound();
	}

	return (
		<div style={{ maxWidth: "720px", margin: "0 auto" }}>
			<div className="page-header">
				<div>
					<div style={{ marginBottom: "0.25rem" }}>
						<Link href={`/admin/drivers/${driver.id}`} style={{ color: "var(--brand-600)", fontSize: "0.8125rem" }}>
							← Back to Driver Profile
						</Link>
					</div>
					<h1>Edit Driver: {driver.name}</h1>
					<p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
						Update contact details, license, and status
					</p>
				</div>
			</div>

			<div className="card">
				<div className="card-body">
					<DriverForm initialData={driver} />
				</div>
			</div>
		</div>
	);
}
