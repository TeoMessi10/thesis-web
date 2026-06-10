<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## Databas (backend — `thesis-api`)
- Använd Supabase via Python-klienten, anslut med SUPABASE_URL och SUPABASE_KEY från .env
- Kör ALDRIG destruktiva SQL-kommandon (DROP, DELETE, TRUNCATE) utan att fråga användaren först
- Föreslå SQL för granskning istället för att köra det direkt mot databasen
- Läs aldrig .env-filen
- Frontend (`thesis-web`) pratar med databasen via REST — aldrig direkt mot Supabase med secret-nyckel

# Thesis — Projektinstruktioner för AI-agenter

## Vad vi bygger
Thesis är en AI-driven research-plattform för nordiska privatinvesterare.
Användaren skriver in ett bolag (t.ex. Volvo) och får på sekunder en
källhänvisad sammanfattning av senaste kvartalsrapporten: nyckeltal,
VD-citat, risker, möjligheter och värdering. Användaren kan ställa
fritextfrågor och få svar baserade ENBART på bolagets faktiska rapporter
(RAG med källhänvisning). En kommande funktion är en "tes-tracker" som
bevakar användarens investeringsantaganden och larmar när de bryts.

Målgrupp: svenska privatinvesterare på Avanza/Nordnet (B2C), från nybörjare
till semi-proffs. Senare: API:er till banker.

Kärnprincip: ALDRIG hallucinera siffror. Varje påstående om ett bolag måste
kunna spåras till en källa (sidnummer i rapporten). Källhänvisning är både
produktens trovärdighet och dess regulatoriska sköld. Detta är INTE
investeringsrådgivning — det är information och beslutsstöd.

## Arkitektur
Två separata repon (polyrepo):
- `thesis-api`   — Python/FastAPI backend (separat repo)
- `thesis-web`   — Next.js frontend (**detta repo**)

Backend och frontend kommunicerar via REST. API:t versioneras i URL:en
(`/api/v1/...`) så breaking changes kan hanteras utan att tvinga frontend
att uppdatera samtidigt.

## Tech-stack

### Backend (`thesis-api`)
- Python 3.x, FastAPI
- Supabase (managed Postgres + pgvector) för data och vektorsökning
- OpenAI `text-embedding-3-small` (1536 dim) för embeddings
- Anthropic Claude (Sonnet som standard, Opus selektivt) för Q&A och sammanfattningar
- pdfplumber för PDF-parsing
- Pydantic för datavalidering
- INGEN LangChain eller LlamaIndex — vi skriver vår egen tunna RAG-funktion direkt mot SDK:erna

### Frontend (`thesis-web` — detta repo)
- Next.js 15 (App Router), TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Recharts för grafer
- Mobil kommer senare; webb/desktop är primär yta först
- Design i Figma — se länk under Referenser; implementera mot befintliga shadcn-komponenter och projektets tokens

### Data
- Pris/fundamenta: EOD Historical Data (planerat)
- Rapporter: bolagens IR-sidor (scraping) + Cision/MFN (realtid, planerat)

## Databasschema (Supabase)
Tabeller: `companies`, `documents`, `chunks`, `company_summaries`, `query_logs`.
- `chunks.embedding` är `vector(1536)` med HNSW-index för cosine-sökning
- Row Level Security (RLS) är AKTIVERAT på alla tabeller
- Backend ansluter med secret-nyckel (kringgår RLS) — frontend ska aldrig ha secret-nyckeln

## RAG-pipeline (kärnan)
1. PDF → text (pdfplumber), per sida
2. Chunking: ~400 tokens, ~80 overlap, varje chunk får sidans rubrik som prefix
3. Embedding per chunk (OpenAI), sparas i `chunks`
4. Vid fråga: översätt frågan till engelska först (de flesta nordiska bolag
   rapporterar på engelska — detta löste ett verkligt cross-language-problem),
   embedda, hämta top-K via pgvector, skicka till Claude med strikt
   källhänvisningsprompt
5. Logga varje fråga/svar/källor/latens i `query_logs` (eval från dag 1)

## Regler för dig som agent
- Föreslå SQL för granskning. Kör INTE destruktiva kommandon
  (DROP, DELETE, TRUNCATE, ALTER som tar bort data) — fråga användaren först.
- Behåll källhänvisning i all RAG-relaterad kod. Ta aldrig genvägar som
  gör att svar saknar spårbarhet till källa.
- Föreslå inte LangChain/LlamaIndex eller andra tunga abstraktioner.
- Håll lösningar enkla och läsbara — användaren bygger förståelse, inte bara kod.
- När du ändrar API-kontrakt (request/response-format), påminn om att
  motsvarande TypeScript-typer i thesis-web måste uppdateras manuellt.
- Standardmodell för Claude-anrop: Sonnet. Föreslå Opus bara för komplexa fall.
- Skriv kod som kan flyttas in i en framtida monorepo-struktur
  (`apps/pipeline/`) utan stor omskrivning.

## Kodstil
- Tydliga funktionsnamn, korta funktioner, en uppgift per funktion
- Pydantic-modeller för all data in/ut ur API:t
- Type hints överallt
- Kommentarer på svenska är okej; kod och variabelnamn på engelska

## Referenser (agenten kan ev. inte öppna dessa — info ska finnas i filen ovan)
- GitHub backend: https://github.com/TeoMessi10/thesis-api
- GitHub frontend: https://github.com/TeoMessi10/thesis-web
- Figma (design): https://www.figma.com/design/u5XwmHhF3rOKwdENKL6XlW/Thesis-%E2%80%93-Desktop-Mockups--Editorial-Terminal-?node-id=2-2 — använd Figma MCP (`get_design_context`) vid design-to-code; matcha layout mot skärmdump, inte genererad referenskod rakt av.