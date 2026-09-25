"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendQuoteEmail } from "@/lib/actions/emails";

interface QuoteFollowUpButtonProps {
	quoteId: string;
	hasEmail: boolean;
}

/**
 * Re-sends the existing quote proposal email as a follow-up nudge.
 * Reuses sendQuoteEmail() as-is — no new email/WhatsApp system introduced.
 */
export function QuoteFollowUpButton({ quoteId, hasEmail }: QuoteFollowUpButtonProps) {
	const router = useRouter();
	const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

	if (!hasEmail) {
		return (
			<span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
				No client email on file
			</span>
		);
	}

	async function handleFollowUp() {
		setState("sending");
		const res = await sendQuoteEmail(quoteId);
		if (res.success) {
			setState("sent");
			router.refresh();
		} else {
			setState("error");
		}
	}

	return (
		<button
			type="button"
			onClick={handleFollowUp}
			className="btn btn-sm btn-secondary"
			disabled={state === "sending"}
			style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}
			aria-label={`Send follow-up email for quote ${quoteId}`}
		>
			{state === "sending" && "Sending…"}
			{state === "sent" && "✓ Sent"}
			{state === "error" && "Failed — retry"}
			{state === "idle" && "Follow Up"}
		</button>
	);
}
