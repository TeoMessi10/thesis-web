This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
│   │   ├── market.ts             # EODHD: quotes, history, chart builder
│   │   └── supabase/
│   │       ├── client.ts         # Browser client (client components)
│   │       ├── server.ts         # Server client (server components)
│   │       └── middleware.ts     # updateSession — token refresh
│   │
│   └── proxy.ts                  # Next.js 16 proxy (session handling)
│
├── public/                       # Static SVG assets
├── .env.local                    # EODHD_API_KEY, SUPABASE_URL/KEY (not in git)
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

> The backend lives in a separate repo (`thesis-api`, Python/FastAPI) and is reached over REST.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



