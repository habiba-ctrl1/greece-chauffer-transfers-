// ============================================================
// Greece Chauffeur Service — Cloudflare-Compatible Email Dispatcher
// ============================================================

import { getCompanySettings } from "@/lib/actions/settings";

export interface SendEmailPayload {
	to: string;
	toName?: string;
	subject: string;
	html: string;
	text?: string;
}

export interface SendEmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
	isMock?: boolean;
}

/**
 * Replace placeholders like {{customer_name}}, {{quote_number}}, etc.
 */
export function interpolateTemplate(
	template: string,
	variables: Record<string, string | number | null | undefined>
): string {
	return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
		const val = variables[key];
		return val !== undefined && val !== null ? String(val) : "";
	});
}

/**
 * Sends email via Resend REST API or simulates sending if API key is not configured.
 */
export async function dispatchEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
	try {
		const settings = await getCompanySettings();
		const apiKey = settings.resend_api_key?.trim();
		const fromEmail = settings.sender_email?.trim() || "transfers@greecechauffeur.com";
		const fromName = settings.sender_name?.trim() || settings.company_name || "Greece Chauffeur Service";

		const fromAddress = `${fromName} <${fromEmail}>`;

		// If no Resend API key is configured, safely mock the delivery
		if (!apiKey) {
			console.log(`[MOCK EMAIL DISPATCH] To: ${payload.to} | Subject: ${payload.subject}`);
			return {
				success: true,
				messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
				isMock: true,
			};
		}

		// Dispatch via Resend REST API
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: fromAddress,
				to: payload.toName ? [`${payload.toName} <${payload.to}>`] : [payload.to],
				subject: payload.subject,
				html: payload.html,
				text: payload.text || undefined,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMsg = (errorData as { message?: string }).message || `Resend HTTP error ${response.status}`;
			console.error("Resend API failed:", errorMsg);
			return {
				success: false,
				error: errorMsg,
			};
		}

		const data = (await response.json()) as { id?: string };
		return {
			success: true,
			messageId: data.id || `resend_${Date.now()}`,
			isMock: false,
		};
	} catch (err) {
		console.error("Email dispatch exception:", err);
		return {
			success: false,
			error: (err as Error).message || "Email dispatch failed",
		};
	}
}

/**
 * Luxury HTML wrapper for all Greece Chauffeur Service outgoing emails
 */
export function wrapInLuxuryEmailTemplate(contentHtml: string, title: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #212529; }
    table { border-collapse: collapse; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background-color: #12151b; padding: 32px 30px; text-align: center; border-bottom: 2px solid #d4af37; }
    .logo-text { font-size: 20px; font-weight: 700; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0; }
    .logo-gold { color: #d4af37; }
    .subtitle { color: #8e94a0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }
    .body-content { padding: 36px 32px; background-color: #ffffff; }
    .footer { background-color: #f8f9fa; padding: 24px 32px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #12151b; color: #d4af37; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; border: 1px solid #d4af37; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #eef2ff; color: #3b5bdb; }
    .info-card { background: #fdfdfd; border: 1px solid #e9ecef; border-left: 3px solid #d4af37; border-radius: 6px; padding: 16px; margin: 20px 0; }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #0f1115;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <div class="header" style="background-color: #12151b; padding: 32px 30px; text-align: center; border-bottom: 2px solid #d4af37;">
            <p class="logo-text" style="font-size: 20px; font-weight: 700; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0;">
              Greece <span class="logo-gold" style="color: #d4af37;">Chauffeur</span>
            </p>
            <div class="subtitle" style="color: #8e94a0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;">
              Executive Transfers & Private Chauffeur
            </div>
          </div>

          <!-- Body -->
          <div class="body-content" style="padding: 36px 32px; background-color: #ffffff; line-height: 1.6;">
            ${contentHtml}
          </div>

          <!-- Footer -->
          <div class="footer" style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 6px;"><strong>Greece Chauffeur Service</strong> — Athens & All Major Greek Destinations</p>
            <p style="margin: 0 0 10px;">24/7 Operations Hotline & VIP Support</p>
            <p style="margin: 0; font-size: 11px; color: #adb5bd;">This is an official communication regarding your executive chauffeur itinerary.</p>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
