# ApplySmarter

AI-powered job application assistant. Upload a CV, paste a job description, get 7 AI analysis modules.

## Stack

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS v4
- **Backend:** Express API on port 3001 (proxied by Vite in dev)
- **Database:** Supabase (Postgres + Auth + Storage)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **State:** Zustand

## Dev

```bash
npm run dev          # Starts both Vite (5173) and Express (3001) via concurrently
npm run dev:client   # Vite only
npm run dev:server   # Express only
npm run test         # Vitest
npm run build        # Production build
```

## Environment

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

## Conventions

- UK English throughout all UI copy and agent prompts
- TypeScript strict mode, no `any`
- Zod for all API input validation and agent output validation
- Tailwind v4 with CSS-based config (no tailwind.config.ts) — theme tokens in `src/index.css`
- Agent prompts are pure functions in `server/agents/prompts/` — testable without API calls
- All database writes go through Express (service-role key), never from browser
- SSE streaming for analysis results (fetch + ReadableStream, not EventSource)

## Architecture

- `server/` — Express API (app.ts = factory, index.ts = dev entry)
- `server/agents/prompts/` — 7 agent prompt functions
- `server/agents/runner.ts` — Parallel agent orchestrator
- `server/routes/` — API route handlers
- `server/middleware/` — Auth + usage limit middleware
- `src/` — React frontend
- `src/components/` — UI components
- `src/hooks/` — Custom React hooks
- `src/stores/` — Zustand stores
- `src/pages/` — Route-level page components
