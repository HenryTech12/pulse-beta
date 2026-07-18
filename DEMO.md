# Demo script — PULSE frontend (live backend) — ~3 minutes

## Prerequisites
1. Backend: `uvicorn api:app --port 8000` running, `ANTHROPIC_API_KEY` set (for real
   `"source": "llm"` responses instead of the fallback).
2. Frontend: `.env` -> `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=http://localhost:8000`.
3. `npm install && npm run dev`, open the app. The header shows a **Live** badge
   (green) once mock mode is off — if it still says **Mock mode**, the env
   var didn't take (restart the dev server after editing `.env`).

## Step 1 — Sign in & dashboard (20s)
1. Sign in with a phone number. This starts a session — the header shows **Live**.
2. Dashboard shows the balance card pulling `current_balance`, `archetype`, and
   `days_until_due` straight from `GET /user/{id}/personalization` — the real
   fields, not the invented `trust_score`/`limits` the old build used.

## Step 2 — Trigger a real decision (60s) — the main moment
1. Tap **Transfer**, send a large amount (e.g. NGN 760,000) to any recipient.
2. On confirm, the app fires **one** batched `POST /session/event` — the full
   screen sequence and keystroke timing collected since login, not a stream
   of micro-events.
3. Watch the decision come back live:
   - **approve** -> no interruption, straight to the simulated payment.
   - **soft_challenge** -> a distinct verification modal appears (shows
     `risk_score`, `reasoning`, `source: "llm"`).
   - **block** -> an unmistakable stop screen, payment never runs.
4. Open **Sim** (Contract tester) tab to show judges the raw JSON request and
   response exchanged with the real API — proof it's not mocked.

## Step 3 — Simulated payment (15s)
Once approved (directly or after a challenge), a short "Processing payment…"
step runs against the local sandbox simulator — no real money moves, but the
flow behaves like a real gateway (latency, occasional decline).

## Step 4 — Analyst Copilot & Cases (60s)
These are clearly-labeled demo-only features (no `/transactions` or `/cases`
endpoint exists on the real backend — see the Frontend Integration Fix Brief).
1. Tap the Copilot FAB, ask "Show suspicious transactions over NGN 50,000".
2. Evidence cards include the actual PULSE decision for any transaction that
   went through the live flow in Step 2.
3. Create a case, route to Compliance, add a note — same as before.

## What changed vs. the old build
- One batched session call instead of nine micro-events.
- The response (`risk_score`, `decision`, `reasoning`, `source`) is captured
  and drives visible UI states instead of being discarded.
- Personalization card shows the real fields (`archetype`, `shortfall_amount`,
  `days_until_due`) instead of invented ones.
- `/transactions` and `/cases` are local-only and labeled as such.
- The header always shows whether you're in Mock mode or Live — flip
  `VITE_USE_MOCK` in `.env` before a real demo so judges see Live.
