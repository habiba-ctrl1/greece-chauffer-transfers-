import { checkDatabaseConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const dbConnected = await checkDatabaseConnection();

	return NextResponse.json({
		status: dbConnected ? "healthy" : "unhealthy",
		database: dbConnected ? "connected" : "disconnected",
		timestamp: new Date().toISOString(),
	}, {
		status: dbConnected ? 200 : 503,
	});
}
