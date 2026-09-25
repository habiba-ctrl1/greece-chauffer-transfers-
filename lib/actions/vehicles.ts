// ============================================================
// Vehicle Read Queries — Dashboard Support Only
// ============================================================
// There is no Vehicles admin module yet (no list/detail/create page).
// This file intentionally holds only the minimal read-only aggregate the
// dashboard's Fleet Status section needs. Do not grow this into full CRUD
// here — that belongs to a dedicated Vehicles module.
"use server";

import { getDb } from "@/lib/db";
import { VEHICLE_STATUSES } from "@/lib/constants";
import type { VehicleStatus } from "@/lib/schema";

export interface VehicleFleetSummary {
	byStatus: Record<VehicleStatus, number>;
	total: number;
}

export async function getVehicleFleetSummary(): Promise<VehicleFleetSummary> {
	const zeroed = Object.fromEntries(
		VEHICLE_STATUSES.map((s) => [s, 0])
	) as Record<VehicleStatus, number>;

	try {
		const db = await getDb();
		const { results } = await db
			.prepare("SELECT status, COUNT(*) as count FROM vehicles GROUP BY status")
			.all<{ status: VehicleStatus; count: number }>();

		let total = 0;
		for (const row of results || []) {
			if (row.status in zeroed) zeroed[row.status] = row.count;
			total += row.count;
		}

		return { byStatus: zeroed, total };
	} catch (e) {
		console.error("Error in getVehicleFleetSummary:", e);
		return { byStatus: zeroed, total: 0 };
	}
}
