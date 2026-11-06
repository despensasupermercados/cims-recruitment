# CIMS Recruitment — recruitment.cims.work

Public monthly recruitment submission form for Yanna (TDG Recruitment), plus the
automated team digest, invitation and reminder emails. A standalone Cloudflare
Worker — deliberately shares **no code and no database** with `cims-hr-console`.
If this worker breaks, the console is unaffected.

## What it does

1. **`GET /`** — the submission form (CIMS-branded, no login). Live reconciliation
   checks: fleet totals must match pipeline counts, sourcing channels must sum to
   in-process. Bad numbers cannot be submitted.
2. **`POST /api/submit`** — validates server-side, writes one row per month to the
   Airtable base *TDG Recruitment Pipeline → Monthly Submission* (a resubmission
   for the same month updates the row and marks the email **REVISED**), computes
   deltas + approval-rate trend against all prior months, and emails the digest
   via cims-mailer — To: Miguel, Rita · Cc: the CIMS team.
3. **Cron, first Monday 09:00 Manila** — invitation email to Yanna covering the
   month just ended.
4. **Cron, the Thursday after (+3) and the one after that (+10)** — reminders, each
   only if nothing was submitted. The day-10 mail says which part of the draft is
   still empty. Form-cycle mails go To recruitment@tdgcm.ph, Cc Joy and Yanna
   (`ADMIN_MAIL` in config); `REMINDER2_EXTRA_CC` adds managers to the day-10 one.
5. **`GET /health`** — shows whether the Airtable token and email are configured.
6. **`GET /preview/digest?k=<key>&month=October%202026`** — renders the digest for a
   stored month against the live console, sends nothing. Check a template change
   here before anyone's inbox sees it.

## The digest (v3, Nov 2026)

"Daylight, CIMS edition" layout: verdict pill, headline, three lines, coverage
bars (demand = console sign-offs; relief only — `GROWTH_DEMAND` in config adds
the second line), ready/sign-off names, funnel tiles + interviews-per-month
trend, by-fleet matrix + headcount + ship coverage, action list with an owner
on every row, "not yet measured" rows that stay until the data exists, joined
split into first contracts vs rotation, forecast vs actual. Names in the form are
matched against the console crew register (case, diacritics and "(RCL)" suffixes
ignored) to tell new hires from returning crew and to flag expired documents on
anyone listed as ready. Every console-fed section degrades to a one-line note if
the binding is down. `src/emails.js renderDigest`, `src/consoleData.js digestContext`.

## Safety rails

- Until every placeholder address in `src/config.js` is replaced, submissions are
  **saved but no email is sent** — nothing goes out half-configured.
- Honeypot field rejects bots; all inputs validated server-side.
- Secrets live only in Cloudflare (never in this repo).

## One-time setup (~10 minutes, all in the Cloudflare dashboard)

1. **Workers & Pages → Create → Import a repository** → pick
   `despensasupermercados/cims-recruitment`. Build settings: none needed —
   wrangler.toml drives everything (name `cims-recruitment`, custom domain
   `recruitment.cims.work`, crons).
2. **Settings → Variables & Secrets** → add two secrets:
   - `AIRTABLE_TOKEN` — create at airtable.com/create/tokens, scopes
     `data.records:read` + `data.records:write`, access: only the
     *TDG Recruitment Pipeline* base.
   - `RESEND_API_KEY` — the same key the HR console uses.
3. **Edit `src/config.js` on GitHub** (pencil icon): replace the 9 placeholder
   email addresses, commit. The worker redeploys automatically.
4. Open `https://recruitment.cims.work/health` — both flags should be `true`.

## Editing later

The only file that ever needs a human: `src/config.js` (recipients, sender,
console link). Field IDs are pinned to the Airtable base — never rename fields
there.

## Tests

```
npm test        # node --test — validation, reconciliation, cron-date logic
```
