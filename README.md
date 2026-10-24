# FinanceFlow

An AI-powered financial workflow coordinator built with Next.js, React, TypeScript, Tailwind, Supabase, and OpenAI. Configure reusable workflows through a visual builder, assign roles, review evidence, manage approvals, and track financial records. The flagship example is Northstar Cloud's fictional $100,000 US marketing campaign.

## Run

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Demo mode works without credentials and saves isolated browser data. Workspace mode requires Supabase configuration and the migration; real AI requires an OpenAI API key. No real payments or external messages are executed.

## Team starting point

- [Product spec](docs/PRODUCT_SPEC.md)
- [Shared idea guidelines](docs/IDEA_GUIDELINES.md)
- [Handoff and code map](docs/HANDOFF.md)
- [Database, environment, and Vercel setup](docs/DEPLOYMENT.md)
- [AI contributor instructions](AGENTS.md)

The owner explicitly expanded the original local-only prototype scope to real accounts, persistence, documents, and AI. Original guidelines are preserved under docs/archive. The original prototype is still available at /prototype.

## Validate

Stop the dev server, then run `npm run check` for TypeScript, workflow/PostgreSQL tests, and production build. `npm start` serves the built app. Live Supabase/Auth/Storage and OpenAI smoke tests require configured services; see the deployment checklist.

Use one branch per change, preserve the workflow engine's financial and authorization controls, and update the shared docs whenever assumptions change.
