# FinanceFlow teammate handoff — v0.2

Updated 24 October 2026. This extends the existing application. Read IDEA_GUIDELINES.md, PRODUCT_SPEC.md, and DEPLOYMENT.md before changing it. The original demo is preserved at /prototype.

## Current implementation

- Modern dashboard with active instances, blocked stages, approval counts, and summaries grouped by currency.
- Visual template builder: stage types, order, roles, required evidence, thresholds, approval/rejection outcomes, financial effects, drafts and publishing.
- Generic server-validated sequential engine, immutable instance template snapshots, revisions, role/person checks, cancellation, reassignment, audit history, optimistic locking and idempotency.
- Public demo adapter with isolated browser persistence and explicitly simulated roles/assistant.
- Supabase email auth through HTTP-only cookies, private workspaces, email-bound invitation links, role management, RLS-scoped reads, atomic server-only writes, and private storage.
- Real OpenAI Responses adapter with bounded read tools, structured evidence-linked answers, stored messages/proposals, confirmation through the engine, and per-user quotas.
- PDF/CSV/XLSX upload, signed private file links, structured extraction and human review. No automatic money mutation from extracted fields.

## Configuration status

The application can run and build without credentials. Real accounts, database persistence, private file storage, and real AI require the environment variables and migration in DEPLOYMENT.md. Their live behavior must be smoke-tested once configured. Unconfigured services show explicit errors; no fake backend success is substituted.

## Code map

| Path | Responsibility |
| --- | --- |
| components/platform/Platform.tsx | Dashboard, workflow detail, modes, account controls, documents and people |
| components/platform/WorkflowBuilder.tsx | Visual template editor |
| components/platform/Assistant.tsx | Chat, evidence references, proposal confirmation entry point |
| lib/platform/schema.ts | Zod domain and action schemas |
| lib/platform/engine.ts | Deterministic transitions, role checks, blockers and financial rules |
| lib/platform/seed.ts | Marketing/vendor templates and fictional seeded demo |
| lib/platform/assistant.ts | Explicit demo-only rules adapter |
| lib/server/supabase.ts | Authenticated user client and server-only admin client |
| lib/server/repository.ts | Authorized reads, membership-bound actors and atomic persistence |
| lib/server/ai.ts | OpenAI read tools, schema-validated answers and document extraction |
| app/api/* | Authentication, bootstrap, templates, instances, transitions, documents, AI, proposals, roles, invitations |
| supabase/migrations/202610240001_financeflow.sql | Tables, RLS, storage policy and transaction functions |
| tests/engine.test.ts | Monetary, permission, branching, blocker and idempotency tests |
| tests/database.test.ts | Embedded PostgreSQL migration/RLS/atomicity/invitation checks |
| components/FinanceFlow.tsx, lib/workflow.ts | Original v0.1 prototype and sample document content |

## How to extend safely

Keep the engine independent from React and external services. All live state must be loaded from the database and roles derived from membership. Never accept a workspace snapshot or actor role from the browser. Demo snapshots are intentionally client-owned and must stay on the demo path.

Templates are configurable data; never evaluate user code. Stage IDs are generic in the new engine. The old prototype still uses hardcoded IDs and is intentionally separate. Editing a published template must not alter running instances.

Persist a state update with its audit entries, stage executions, documents, and approvals in one transaction. Check version and request ID. AI proposals have their own stored version and cannot be applied after unrelated changes without regeneration.

For new financial effects, define invariants first. Current available = received − committed; allocation is an earmark, not an expense. A receipt is a manually confirmed record, never bank verification. Do not combine currencies.

## Verification and remaining limits

The initial new suite passes engine tests and runs the migration in PGlite using mocked Supabase auth/storage tables. It checks tenant reads, denied direct writes/RPCs, atomic version conflicts, duplicate updates, and email-bound invitations. All 16 tests and the production build pass. The app is deployed at https://financeflow-prototype-gules.vercel.app from main. See the latest implementation report for browser/deployment verification.

Live Supabase registration, storage upload, cross-account behavior, and OpenAI API calls require credentials and have not been verified against configured external services. PGlite is a real PostgreSQL engine, but its auth/storage fixtures do not reproduce Supabase's full service layer.

No external email/message delivery, payment processing, bank balances, Xero/Slack/Round integration, arbitrary graph engine, conversion rates, automated background jobs, or real financial reconciliation is implemented. Uploaded PDF/XLSX files open through private links; the in-app preview shows metadata, CSV text, and extraction fields. Extraction is limited to the active stage; completed evidence stays readable. Demo AI uses rules even if a server OpenAI key exists; authenticated workspace mode uses real AI to prevent anonymous API spending.

## Local commands

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Stop the dev server before `npm run check`. For production locally, use `npm run build` then `npm start`.
