# Thesis — Web (`thesis-web`)

AI-driven research platform for Nordic retail investors. Type in a company
(e.g. Volvo) and within seconds get a **source-cited** summary of the latest
quarterly report: key figures, CEO quotes, risks, opportunities and valuation.
Users can ask free-text questions and get answers grounded **only** in the
company's actual reports (RAG with citations).

This repo is the **frontend** (Next.js). The backend lives in a separate repo,
[`thesis-api`](https://github.com/TeoMessi10/thesis-api) (Python/FastAPI), and
is reached over REST.

> **Core principle:** never hallucinate numbers. Every claim about a company
> must be traceable to a source (a page number in the report). Citations are
> both the product's credibility and its regulatory shield. This is **not**
> investment advice — it is information and decision support.

---

## What we're building

- **Search → company page.** A user searches a ticker and lands on
  `/{ticker}` (e.g. `/VOLV-B`, `/EVO`).
- **AI Q&A with citations.** Questions are answered by a thin RAG pipeline in
  the backend; every statement carries a page reference (`s. 12`).
- **Report metrics.** Key figures are extracted from the latest report by the
  backend and shown with the exact value, unit and page number.
- **Live market data.** Prices, daily change and the 6-month chart come from
  EODHD (real, server-side only).
- **Auth-gated product.** The AI functionality lives behind login
  (Supabase auth); the landing page is public.
- **A future "thesis tracker"** will watch a user's investment assumptions and
  alert them when broken.

Target audience: Swedish retail investors on Avanza/Nordnet (B2C). UI copy is
primarily in Swedish; code and identifiers are in English.

---

## Two data sources (important mental model)

| Concern | Source | Notes |
| --- | --- | --- |
| Stock price, daily change, 6-month chart, OMXS30 | **EODHD** | Real market data, ~15 min delayed. Server-side only. |
| Report metrics, AI Q&A answers | **The reports (RAG + Claude)** | Every figure cited to a page number. |

"Fundamentals" like P/E, P/S and dividend yield are **not** included yet — they
come from neither the report (must be computed against the live price) nor the
current EODHD free plan (fundamentals are locked there). See "Known limitations".

---

## Tech stack

- **Next.js 16** (App Router) + **React 19**, **TypeScript** (strict mode)
- **Turbopack** is the default bundler (`next dev` / `next build`). To use
  Webpack instead, opt in with `next dev --webpack` / `next build --webpack`.
- **Tailwind CSS v4** (CSS-first; configured via `@theme` in
  `src/app/globals.css`, no `tailwind.config.ts`)
- **Supabase** for authentication (`@supabase/ssr`)
- **EODHD** for market data
- Backend (separate repo): Python/FastAPI, Supabase (Postgres + pgvector),
  OpenAI embeddings, Anthropic Claude. **No LangChain/LlamaIndex.**

---

## Getting started

### Prerequisites

- **Node.js 20.9+**
- The backend [`thesis-api`](https://github.com/TeoMessi10/thesis-api) running
  locally on `http://127.0.0.1:8000` (the API base is set in `src/lib/api.ts`)
- A Supabase project (URL + anon key)
- An EODHD API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the repo root (it is git-ignored):

```bash
# Supabase — safe to expose to the browser (anon key, RLS-protected)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# EODHD — SERVER ONLY. No NEXT_PUBLIC_ prefix: must never reach the browser.
EODHD_API_KEY=your-eodhd-key
```

> ⚠️ Never give the frontend the Supabase **secret** key, and never add a
> `NEXT_PUBLIC_` prefix to `EODHD_API_KEY`. `src/lib/market.ts` is server-only —
> do not import it from a `"use client"` component; pass fetched data down as
> props instead.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## How it talks to the backend

The REST client lives in `src/lib/api.ts` (base URL `http://127.0.0.1:8000/api/v1`):

| Function | Endpoint | Purpose |
| --- | --- | --- |
| `getCompany(ticker)` | `GET /companies/{ticker}` | Company details |
| `getMetrics(ticker)` | `GET /companies/{ticker}/metrics` | Key figures extracted from the report (cited) |
| `askCompany(ticker, q)` | `POST /companies/{ticker}/ask` | RAG Q&A answer + sources |

TypeScript types in `src/lib/types.ts` **mirror the backend's Pydantic models**.
When the API contract changes, these types must be updated manually.

---

## Authentication flow

- `src/lib/supabase/client.ts` — browser client (Client Components)
- `src/lib/supabase/server.ts` — server client (Server Components, Route Handlers)
- `src/lib/supabase/middleware.ts` — `updateSession` refreshes tokens
- `src/proxy.ts` — Next.js 16 proxy (formerly `middleware.ts`) wires it all up

Protected routes (`/dashboard`, `/{ticker}`) check `supabase.auth.getUser()`
server-side and redirect to `/login` when there's no session.

---

## Project structure

```text
thesis-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── [ticker]/             # Dynamic company page (/VOLV-B, /EVO ...)
│   │   │   ├── page.tsx          #   Server: fetches company + EODHD price + metrics
│   │   │   └── AskBox.tsx        #   Client: AI Q&A with source citations
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Protected dashboard (requires login)
│   │   ├── login/
│   │   │   └── page.tsx          # Login (Supabase)
│   │   ├── signup/
│   │   │   └── page.tsx          # Sign up (Supabase)
│   │   ├── layout.tsx            # Root layout, fonts, nav, OMXS30
│   │   ├── page.tsx              # Landing page (hero, search, showcases)
│   │   ├── globals.css           # Tailwind v4 @theme (tokens, keyframes)
│   │   └── favicon.ico
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Nav.tsx               # Navbar (scroll styling, OMXS30)
│   │   ├── NavAuth.tsx           # Logged-in / logged-out toggle in the nav
│   │   ├── SignOutButton.tsx     # Sign out
│   │   ├── Hero.tsx              # Hero section with 3D terrain
│   │   ├── HeroSearch.tsx        # Search box (typewriter + chips)
│   │   ├── TerrainCanvas.tsx     # 3D terrain on canvas
│   │   ├── Ticker.tsx            # Scrolling price tape
│   │   ├── PriceChart.tsx        # Self-drawing price chart (SVG)
│   │   ├── ThesisCard.tsx        # Thesis card with sparkline
│   │   ├── QADemo.tsx            # Q&A demo on the landing page
│   │   ├── Tilt.tsx              # 3D tilt + magnetic buttons
│   │   ├── Reveal.tsx            # Scroll reveal + CountUp
│   │   ├── Grain.tsx             # Film grain effect (SVG)
│   │   └── Footer.tsx
│   │
│   ├── hooks/
│   │   └── useMotion.ts          # useReducedMotion, useInView, useFinePointer
│   │
│   ├── lib/
│   │   ├── api.ts                # Client for thesis-api (getCompany, askCompany, getMetrics)
│   │   ├── types.ts              # TS types mirror the backend's Pydantic models
│   │   ├── market.ts             # EODHD: quotes, history, chart builder (server-only)
│   │   └── supabase/
│   │       ├── client.ts         # Browser client (client components)
│   │       ├── server.ts         # Server client (server components)
│   │       └── middleware.ts     # updateSession — token refresh
│   │
│   └── proxy.ts                  # Next.js 16 proxy (session handling)
│
├── public/                       # Static SVG assets
├── .env.local                    # EODHD_API_KEY, SUPABASE_* (not in git)
├── AGENTS.md                     # Project instructions for AI agents
├── CLAUDE.md                     # Points to AGENTS.md
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## Conventions

- **TypeScript strict mode** — type everything; keep API types in sync with the
  backend.
- **Tailwind v4 is CSS-first** — design tokens, fonts, keyframes and the
  `max-w-wrap` container live in the `@theme` block of `src/app/globals.css`.
  There is no `tailwind.config.ts`.
- **Keep market data server-side.** Anything touching `EODHD_API_KEY` runs in a
  Server Component and passes plain data to client components as props.
- **Preserve citations.** Never take shortcuts in RAG-related UI that drop the
  traceability of an answer to its source.
- **This Next.js is newer than your training data.** Read the relevant guide in
  `node_modules/next/dist/docs/` before writing framework code (see `AGENTS.md`).

---

## Known limitations

- **EODHD free plan.** The current key only allows EOD data. Fundamentals and
  the earnings calendar are locked, so P/E, P/S, dividend yield and "next report
  date" are not wired up. Quotes are cached for 5 minutes to respect the low
  daily quota.
- **Metrics cache.** The backend caches extracted metrics per company in
  process; it resets on backend restart, so the first page view per company
  after a restart is a few seconds slower.

---

## Deploy

The app deploys cleanly to [Vercel](https://vercel.com/new). Remember to set the
environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EODHD_API_KEY`) in the project settings, and
point the API base in `src/lib/api.ts` at the deployed backend.

## Link to the site (still testing it )
https://thesis-black.vercel.app
