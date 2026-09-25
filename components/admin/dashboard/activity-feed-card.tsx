import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { activityEntityHref } from "@/lib/actions/activity";
import type { ActivityFeedItem } from "@/lib/actions/activity";

interface ActivityFeedCardProps {
	activity: ActivityFeedItem[];
	failed?: boolean;
}

function dotColor(action: string): string {
	if (action.includes("cancel")) return "var(--status-danger)";
	if (action.includes("status") || action.includes("assign")) return "var(--status-warning)";
	if (action.includes("created")) return "var(--brand-500)";
	if (action.includes("email") || action.includes("sent")) return "var(--status-info)";
	return "var(--gray-400)";
}

/**
 * Note: no "View Full Activity" link — the /admin/activity-log route
 * doesn't exist yet, and building it is a separate module from this
 * dashboard task. This feed already covers the last several events.
 */
export function ActivityFeedCard({ activity, failed }: ActivityFeedCardProps) {
	return (
		<div className="card">
			<div className="card-header">
				<h2 className="card-title">Recent Activity</h2>
			</div>
			<div className="card-body">
				{failed ? (
					<div className="empty-state" style={{ padding: "2rem 1rem" }}>
						<div className="empty-state-icon">⚠️</div>
						<div className="empty-state-title">Couldn&apos;t load recent activity</div>
						<div className="empty-state-text">Try refreshing the dashboard.</div>
					</div>
				) : activity.length === 0 ? (
					<div className="empty-state" style={{ padding: "2rem 1rem" }}>
						<div className="empty-state-icon">⚡</div>
						<div className="empty-state-title">No activity yet</div>
						<div className="empty-state-text">
							Bookings, quotes, invoices, and driver updates will appear here as they happen.
						</div>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column" }}>
						{activity.map((act) => {
							const href = activityEntityHref(act.entity_type, act.entity_id);
							return (
								<div key={act.id} className="activity-item">
									<div className="activity-dot" style={{ background: dotColor(act.action) }} />
									<div className="activity-content">
										<div className="activity-text">
											{href ? (
												<Link href={href} style={{ color: "var(--text-primary)" }}>
													{act.message}
												</Link>
											) : (
												act.message
											)}
										</div>
										<div className="activity-time">
											{act.actor_name ? `${act.actor_name} · ` : ""}
											{formatDate(act.created_at)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
