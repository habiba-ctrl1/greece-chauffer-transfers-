# Booking inquiry, quotation & email system

Operations guide + audit record for the inquiry → quotation → confirmed-booking workflow.
Stack (unchanged): Next.js 16 on Cloudflare Workers (OpenNext), Cloudflare D1, cookie sessions.

## 1. Audit (before changes)

| Area | Finding |
|---|---|
| Public form | 5-step form wrote a **draft row into `quotes`** (no inquiry entity, no consent, no phone validation, no idempotency, no rate limit, no notification email). Success was shown, but nobody was told. |
| Email | `lib/email/dispatcher.ts` called Resend, **or silently "mocked" success when no key was set** (so a missing key looked like a sent email). The Resend key lived in the **database** and was shown in the settings UI. Default templates claimed "complimentary water, flight monitoring…" (invented service claims). No retries, no PDF. |
| Admin auth | Cookie sessions + PBKDF2 are sound, **but most `"use server"` actions had no authorization check** — Server Actions are public HTTP endpoints, so customer/quote/booking/driver/invoice data was callable without logging in by anyone able to discover an action id. No login rate limit. |
| Admin data | Placeholder company data (fake address, VAT, licence, phone) flowed into emails; booking/invoice terms contained invented refund promises. Sidebar linked to 5 pages that did not exist. `quotes` pages used undefined CSS classes. |
| Quotes | Sent quotes could be edited in place; no versioning, no PDF, no customer acceptance; "convert to booking" worked from any status and was not unique per quote. |
| DB | `schema.sql` only (no migrations); it also **seeds an admin account with a documented password** (`Admin@123456`). |
| Tests/CI | None. CI deployed on push to `main` without tests or DB migration. |

## 2. What was built

**Public site** – `components/site/quote-form.tsx`: 5-step booking form (service → journey → travellers → conditional details → contact). 10 service types; fields appear only when relevant (flight/airline, port/ferry, hotel, child seats, duration, tour preferences, return leg, stops, accessibility). Country-code phone, consent checkbox + `/privacy` notice, double-submit lock, per-field errors with focus, input preserved on failure, honeypot, per-IP and per-email rate limits, idempotency key, landing-page + UTM capture. Success is shown **only after the inquiry is committed**, and never claims a booking or availability.

**Data model** (`migrations/0002_booking_crm.sql`, additive only): `inquiries`, `inquiry_events` (audit/communication timeline), `email_outbox`, `counters` (atomic `GCS-YYYY-00001` references), `rate_limits`; new columns on `quotes` (version, currency, terms, frozen snapshot, acceptance token hash, sent/accepted timestamps), `bookings.inquiry_id` + a unique index so one quotation can create one booking, `customers.first_name/last_name`.

**Email** – durable outbox: the inquiry, customer, timeline row and both emails are written in **one atomic batch**, then sent (immediately in the background, and by the scheduler). Failures are kept, retried with back-off (5 → 10 → 20 → 40 min …, max 5), visible in *Email Activity*, retryable by hand; a sent email can never be "retried" into a duplicate. If the provider is not configured emails stay **queued — never reported as sent**. Provider acceptance ≠ delivery: the Resend webhook (`/api/webhooks/resend`, Svix-signed) upgrades rows to *delivered / bounced / complained*.
Templates: owner alert (→ `greecechauffertransfers@gmail.com`, Reply-To = customer), customer acknowledgment, quotation (+PDF), booking confirmation, manual follow-up, quote-accepted alert, follow-up digest. All values HTML-escaped; no promised response times.

**Quotations** – builder at `/admin/quotes/[id]/builder` pre-filled from the inquiry; cent-exact maths (`lib/crm/money.ts`: line items, fixed or % discount, additional charges, explicit tax % — default 0); validation; draft/preview/save; *Review & send* dialog. Sending **freezes a snapshot**, issues a 256-bit acceptance token (only its SHA-256 is stored), queues one email with the PDF attached (double-click safe). A sent quotation is immutable; "New version" creates `…-V2`, and v1 becomes *Superseded* only when v2 is actually sent. PDFs are rendered with `pdf-lib` from the frozen snapshot (deterministic, no file storage needed) and served only through the authenticated `/admin/quotes/[id]/pdf`.

**Acceptance & booking** – customer link `/quote/accept/<token>` (GET never mutates; POST is idempotent, expiry-checked, rate-limited) or owner "Mark accepted". Acceptance moves the inquiry to *Accepted / Awaiting confirmation* and alerts the owner; **it does not confirm the booking**. "Confirm booking" (owner, dialog) creates the booking from the accepted version; unique per quotation. The confirmation email is a separate explicit action available only for confirmed bookings.

**Admin** – Dashboard block (real counts + ranges), *Inquiries* (search, filters, sort, pagination, CSV export for owners), inquiry detail (customer, journey, quotation versions, email history, activity timeline, notes, status, follow-up), *Follow-ups* (overdue / today / upcoming / unscheduled), *Reports*, *Email Activity*, *Settings* (reminder intervals, tax %, default terms — secrets are not editable here). Navy + champagne tokens apply to the existing admin.

**Follow-ups** – defaults (all editable): inquiry → reminder after 4 h; quotation → 24 h, then 72 h; repeat off. Marking contacted re-plans; "customer responded" clears reminders; closed/lost/cancelled/confirmed never remind. Scheduler sends the owner a digest (deduped, twice a day max). Customer follow-up emails are **manual only**.

## 3. Security changes
* `requireAdmin()/requireOwner()` at the top of **every** admin server action (a test fails the build if one is added without it); pages check the session before querying.
* Login: 8 attempts / 15 min per account, 30 per IP (D1-backed).
* Resend key and sender removed from the DB/UI → Worker secrets. Settings page owner-only.
* Security headers, `no-store` + `noindex` on admin and token pages, `Referrer-Policy: no-referrer` on the acceptance page.
* Cron endpoint and webhook protected by secrets (constant-time compare, signature + replay window).
* CSV formula-injection neutralised; all email output escaped; parameterised SQL everywhere (sort columns whitelisted).
* Legacy placeholder company data is ignored; invented default terms removed.
* The baseline migration deliberately **does not re-seed** the documented-password admin.

## 4. Production activation checklist (not done by the code)

1. **Rotate/confirm the admin password.** `schema.sql` seeded `admin@greecechauffeur.com` / `Admin@123456`. If that account still exists with the default password, change it now.
2. **Email domain** – in Resend, add and verify `greecechaufferservice.com` (SPF + DKIM records); add a DMARC record (`v=DMARC1; p=none; rua=mailto:greecechauffertransfers@gmail.com` to start). A Gmail address **cannot** be used as the authenticated sender of a different domain; mail is sent *from* `bookings@greecechaufferservice.com` (or similar) and *to/replies* go to the Gmail inbox.
3. **Secrets** (`npx wrangler secret put NAME`): `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` (e.g. `bookings@greecechaufferservice.com`), `CRON_SECRET` (long random), `RESEND_WEBHOOK_SECRET` (from the Resend webhook). Plain vars (wrangler `vars` or dashboard): `EMAIL_FROM_NAME`, `BOOKING_NOTIFICATION_EMAIL` (defaults to `greecechauffertransfers@gmail.com`), optional `OPS_ALERT_EMAIL`, `APP_BASE_URL=https://greecechaufferservice.com`.
4. **Resend webhook** → `https://greecechaufferservice.com/api/webhooks/resend`, events: sent, delivered, delivery_delayed, bounced, complained, failed.
5. **GitHub repo secrets** for the scheduler: `APP_URL`, `CRON_SECRET` (same value as the Worker secret). `.github/workflows/cron.yml` calls `/api/cron/tick` every 15 min (GitHub's schedule is best-effort; the app also sends immediately after each inquiry).
6. **Database** – the deploy workflow now runs `wrangler d1 migrations apply … --remote` before deploying. To apply by hand: `npx wrangler d1 migrations apply greece-chauffer-transfers-db --remote`. D1 Time Travel gives point-in-time restore (7–30 days depending on plan) — export regularly for off-platform backups.
7. **Settings** → enter payment terms, cancellation terms, inclusions/exclusions, business phone/address/VAT. Until then PDFs omit those sections (nothing is invented).
8. **Test**: *Email Activity → Send test email*, submit a real inquiry, confirm both emails reach the inboxes (check spam), send yourself a quotation and open the PDF/acceptance link.
9. Have the privacy notice (`/privacy`) and retention period reviewed by someone qualified; it describes the data actually collected but is not legal advice. Set a data-retention routine (e.g. archive inquiries after N months).

## 5. Known limitations
* PDF uses standard fonts: Greek text is transliterated to Latin and other non-Latin scripts become `?` (embed a font to change this).
* Inquiries that arrived through the old form remain as *draft quotes* in the Quotes list; they were not migrated.
* "Ready to send" and a separate "Follow-up due" status are not stored: sending is a single review-and-send step, and follow-up-due is derived from the reminder date.
* Resending an already-sent quotation is not offered; use "New version" (which issues a fresh link).
* The legacy invoice/booking/driver screens were only hardened (auth), not redesigned. Payments are not collected or tracked by this system.
* Automated tests run the real SQL against SQLite (node:sqlite), not Cloudflare's D1 runtime; browser-tested locally against `wrangler`'s local D1 with the console email transport. **Nothing has been sent through Resend or delivered to a real inbox yet.**

## 6. Developing / testing
```bash
npm test                 # 69 tests (vitest): validation, money, outbox, quotations, PDF, security, queries
npx tsc --noEmit && npm run lint && npm run build
npx wrangler d1 migrations apply greece-chauffer-transfers-db --local
# .dev.vars (gitignored) for local runs:  EMAIL_TRANSPORT=console   CRON_SECRET=...
npm run dev
```
