import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { VEHICLE_STATUS_LABELS } from "@/lib/constants";
import type { DriverStatus, VehicleStatus } from "@/lib/schema";

interface FleetStatusCardProps {
	driverByStatus: Record<DriverStatus, number>;
	licenseExpiring: { id: string; name: string; license_expiry: string }[];
	vehicleByStatus: Record<VehicleStatus, number>;
	vehicleTotal: number;
	driversFailed?: boolean;
	vehiclesFailed?: boolean;
}

const DRIVER_STAT_ITEMS: { key: DriverStatus; label: string }[] = [
	{ key: "active", label: "Active" },
	{ key: "pending", label: "Pending" },
	{ key: "under_review", label: "Under Review" },
	{ key: "suspended", label: "Suspended" },
];

const VEHICLE_STAT_ITEMS: VehicleStatus[] = ["available", "assigned", "maintenance", "unavailable"];

export function FleetStatusCard({
	driverByStatus,
	licenseExpiring,
	vehicleByStatus,
	vehicleTotal,
	driversFailed,
	vehiclesFailed,
}: FleetStatusCardProps) {
	return (
		<div className="card">
			<div className="card-header">
				<h2 className="card-title">Fleet Status</h2>
				<Link href="/admin/drivers" style={{ fontSize: "0.75rem", color: "var(--brand-600)", fontWeight: 500 }}>
					Manage Drivers →
				</Link>
			</div>
			<div className="card-body">
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
					{/* Drivers */}
					<div>
						<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.625rem" }}>
							Drivers
						</div>
						{driversFailed ? (
							<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Couldn&apos;t load driver data.</div>
						) : (
							<>
								<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem" }}>
									{DRIVER_STAT_ITEMS.map((item) => (
										<Link
											key={item.key}
											href={`/admin/drivers?status=${item.key}`}
											style={{
												display: "flex",
												alignItems: "baseline",
												gap: "0.375rem",
												padding: "0.375rem 0.625rem",
												borderRadius: "var(--radius-sm)",
												background: "var(--bg-page)",
												border: "1px solid var(--border-default)",
												textDecoration: "none",
											}}
										>
											<span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{driverByStatus[item.key] ?? 0}</span>
											<span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.label}</span>
										</Link>
									))}
								</div>
								<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "0.375rem" }}>
									License expiring within 30 days
								</div>
								{licenseExpiring.length === 0 ? (
									<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>None on record.</div>
								) : (
									<div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
										{licenseExpiring.map((d) => (
											<Link
												key={d.id}
												href={`/admin/drivers/${d.id}`}
												style={{ fontSize: "0.8125rem", color: "var(--status-warning)", display: "flex", justifyContent: "space-between" }}
											>
												<span>{d.name}</span>
												<span>{formatDate(d.license_expiry)}</span>
											</Link>
										))}
									</div>
								)}
							</>
						)}
					</div>

					{/* Vehicles */}
					<div>
						<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.625rem" }}>
							Vehicles ({vehicleTotal})
						</div>
						{vehiclesFailed ? (
							<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Couldn&apos;t load vehicle data.</div>
						) : vehicleTotal === 0 ? (
							<div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
								No vehicles on record yet.
							</div>
						) : (
							<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
								{VEHICLE_STAT_ITEMS.map((status) => (
									<div
										key={status}
										style={{
											display: "flex",
											alignItems: "baseline",
											gap: "0.375rem",
											padding: "0.375rem 0.625rem",
											borderRadius: "var(--radius-sm)",
											background: "var(--bg-page)",
											border: "1px solid var(--border-default)",
										}}
									>
										<span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{vehicleByStatus[status] ?? 0}</span>
										<span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{VEHICLE_STATUS_LABELS[status]}</span>
									</div>
								))}
							</div>
						)}
						<div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.625rem" }}>
							Fleet management isn&apos;t built yet — these counts are read-only until that module exists.
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
