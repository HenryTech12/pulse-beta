# Pulse — Fraud Detection Frontend

A production-ready, mobile-first web frontend for the **Pulse** fraud detection product. It mirrors an Opay-style wallet experience (clean green/white palette) and embeds an **Analyst Copilot** — an LM-driven assistant that queries session/transaction data, surfaces anomalies, and creates routed cases.

Built with **React + TypeScript + Vite**, **Tailwind CSS**, **Zustand**, and **Vitest**.

---

## Features

- **Minimalist Dashboard** — balance card, quick actions (Send / Request / Top-up), recent transactions with filters (amount, status) and load-more.
- **Tab Navigation** — Home, Transfer, Airtime, Betting, Wallet, Cases, Simulator, Settings.
- **Opay-style theme** — signature green `#00A86B`, white, neutral grays; rounded cards, large CTAs, micro-interactions.
- **Analyst Copilot** — collapsible right drawer (desktop) / full-screen overlay (mobile). Natural-language input, conversational history, suggested prompts, evidence cards, quick actions (Approve / Soft Challenge / Block), and case creation routed to Compliance or CS.
- **Real-time decision enforcement** — approve/soft_challenge/block from the live PULSE risk API is captured and rendered as a distinct, visible UI state (see `DecisionGate`), not just logged and discarded.
- **Contract tester** ("Sim" tab) — builds the real batched `SessionEventRequest` (full screen path + keystroke timing, one call per session) and shows the raw request/response exchanged with `/session/event`.
- **Simulated sandbox payments** — a realistic processing → success/decline flow gated by the real decision. No real money moves; see `src/lib/payments.ts` for why.
- **Pattern Analysis & Alerts** — rule engine flags large amounts, geo anomalies, rapid repeats, off-hours activity. Confidence scores and matched rules.
- **Case Management** — list with filter/sort, detail view with evidence, session replay link, team assignment, and notes.
- **Accessibility** — WCAG contrast, keyboard focus rings, skip link, ARIA labels.
- **Code-splitting** — Simulator and Cases routes are lazy-loaded.

---

## Quick start

```bash
# install
npm install

# dev server (http://localhost:5173)
npm run dev

# production build -> dist/
npm run build

# preview the production build
npm run preview

# type check
npm run typecheck

# run tests (vitest, jsdom)
npm test
```

The app runs out-of-the-box against an in-memory **mock decision engine** (`VITE_USE_MOCK=true`) that mirrors api.py's own documented fallback behavior — no backend required to preview the UI. Set `VITE_USE_MOCK=false` to talk to the real `api.py` (`uvicorn api:app --port 8000`).

---

## Environment

All config is env-based (`.env`). Defaults are safe for local dev.

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_USE_MOCK` | `true` | Use in-memory mock fixtures instead of the live backend |
| `VITE_LLM_ENDPOINT` | _(empty)_ | Optional remote LLM endpoint for the Copilot. When empty, a local mock provider is used. |
| `VITE_SUPABASE_URL` | _(set)_ | Supabase project URL (pre-provisioned) |
| `VITE_SUPABASE_ANON_KEY` | _(set)_ | Supabase anon key (pre-provisioned) |

To connect the real backend, set `VITE_USE_MOCK=false` and point `VITE_API_BASE_URL` at your server. The header shows a **Live**/**Mock mode** badge at all times so it's never ambiguous which one you're looking at.

---

## API contract

The frontend talks to exactly the two endpoints that exist on the real PULSE
backend (api.py) — no more, no less:

- `POST /session/event` — **one call per session.** Sends the full batched
  payload (`keystroke_intervals`, `screen_sequence`, `session_duration_sec`,
  `hour_of_day`, `device_hash`, `network_type`, optional
  `transaction_amount`) accumulated client-side by `src/lib/sessionTracker.ts`.
  The response (`risk_score`, `decision`, `reasoning`, `source`,
  `is_cold_start`) is captured and drives the `DecisionGate` UI — it is never
  discarded.
- `GET /user/{user_id}/personalization` — returns `archetype`,
  `preferred_check_day`, `preferred_check_hour`,
  `estimated_recurring_amount`, `days_until_due`, `current_balance`,
  `projected_balance`, `shortfall_amount`. Rendered on Dashboard/Wallet.

**There is no `/transactions` or `/cases` endpoint on the real backend.**
Those power the demo-only "fraud-ops" layer (Cases, Copilot, pattern alerts)
and are handled entirely client-side in `src/lib/mock/fixtures.ts` — they are
never routed through `src/lib/api.ts`, and are visually labeled as
demo/local so judges aren't told they're talking to a live backend when
they aren't.

### Exact screen names (backend-required)

The following screen names are used in every `SessionEvent.screen` and must match the backend schema:

`login`, `dashboard`, `balance`, `transfer`, `confirm`, `logout`, `settings`, `beneficiary_add`, `limit_change`

Type definitions live in [`src/types/contract.ts`](src/types/contract.ts), split clearly between the real backend contract (top of the file) and demo-only types (bottom, explicitly labeled).

---

## Architecture

```
src/
  types/contract.ts        # REAL backend contract + demo-only types, clearly split
  lib/
    env.ts                 # env config + Supabase client
    api.ts                 # real API client — ONLY /session/event + /personalization
    sessionTracker.ts       # accumulates keystroke timing + screen path client-side
    payments.ts             # simulated sandbox payment gateway (no real money)
    copilot.ts              # Copilot provider abstraction (mock + remote LLM)
    patterns.ts              # local pattern rule engine + confidence scoring (demo only)
    mock/fixtures.ts         # demo-only local store (transactions/cases) + mock decision engine
    auth.ts                  # Supabase phone auth + DemoProfile
    cn.ts                    # classnames helper
  store/appStore.ts          # Zustand store — session tracking, decision gate, cases/copilot
  components/
    ui/                      # Button, Card, Badge, Modal primitives
    DecisionGate.tsx         # renders approve/soft_challenge/block — the core UX fix
    TabBar.tsx               # bottom tab navigation
    CopilotPanel.tsx         # Analyst Copilot drawer/overlay
    TransactionRow.tsx      # tx list row + detail
  screens/
    Dashboard.tsx            # balance card (real personalization fields) + tx list + filters
    Services.tsx             # Transfer (real session/decision/payment flow), Airtime, Betting, Wallet, Settings
    Simulator.tsx             # contract tester — raw request/response against the real API
    Cases.tsx                 # demo-only case list + detail
  App.tsx                     # routing, layout, lazy routes, copilot FAB
```

### Copilot LLM abstraction

`src/lib/copilot.ts` exposes a `CopilotProvider` interface with two implementations:

1. **Mock provider** (default) — pattern-based local responses, no network.
2. **Remote provider** — POSTs the prompt + transaction context to `VITE_LLM_ENDPOINT`.

Switch automatically by setting `VITE_LLM_ENDPOINT`. Prompt templates are in `PROMPTS`.

---

## Testing

```bash
npm test            # run once
npm run test:watch  # watch mode
```

- `src/test/patterns.test.ts` — pattern rule engine unit tests.
- `src/test/copilot.test.ts` — Copilot provider unit tests (suspicious tx, cross-check, case drafting).
- `src/test/sessionTracker.test.ts` — verifies the batched request is built correctly (one call, full screen path, correct interval count) instead of per-event.
- `src/test/integration.copilot.test.tsx` — end-to-end: Copilot surfaces a suspicious transaction, creates a case routed to Compliance.

---

## Deployment (Docker)

```bash
# build
npm run build

# serve dist/ via Docker
docker build -t pulse-frontend .
docker run -p 8080:80 pulse-frontend
# open http://localhost:8080
```

The Dockerfile is a multi-stage build: Node builds the static assets, then a lightweight `nginx` serves `dist/`.

---

## Demo script

See [`DEMO.md`](DEMO.md) for the full live-backend walkthrough (session
capture → real decision → decision gate → simulated payment → Copilot →
Cases).

---

## Icon attribution

Icons from [Lucide](https://lucide.dev) (ISC License) via `lucide-react`. Lucide is a community fork of Feather Icons.

---

## PR checklist

- [ ] `npm install` succeeds
- [ ] `npm run dev` starts the dev server
- [ ] `npm run build` produces `dist/`
- [ ] `npm test` passes (15 tests)
- [ ] Copilot flow validated (suspicious tx -> case routed to Compliance)
- [ ] Accessibility checked (keyboard nav, focus rings, contrast, skip link)
- [ ] Docker image builds and serves `dist/` on port 8080
