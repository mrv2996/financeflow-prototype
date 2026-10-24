# FinanceFlow implementation report — 24 October 2026

## Delivered

Continued the original repository and application. Added the full-screen `@xyflow/react` workflow canvas with Start, Task, Approval, AI Agent, Document, Condition and End nodes; drag/drop; connecting outputs; node instructions, roles, evidence and policy configuration; zoom/pan/minimap; layout; reorder; duplicate/delete; drafts and publication. Node coordinates and transitions persist in the existing Supabase JSON definitions and frozen instance snapshots.

Extended the existing engine to follow success, above/below threshold and rejection edges. Rejections can revise/resubmit, route through revision tasks, or cancel at End. Forward cycles, ambiguous outputs, unreachable nodes and paths bypassing required controls cannot be published. Financial calculations, role checks, human confirmations, immutable active instances, version checks and idempotency remain in place. The original $100,000 demonstration and `/prototype` are preserved.

Supabase project **FinanceFlow** (`mhlcadlwrjsjelzawpwh`, eu-west-1) is active. The existing migration was applied successfully. Email/password and email confirmation are enabled, production/local confirmation URLs are allowed, RLS protects workspace reads, client mutations are denied, and the document bucket is private. Credentials are stored only in ignored local environment configuration and encrypted Production variables in the existing Vercel project.

## Verification

- `npm run check`: TypeScript, **23 tests**, production build passed.
- PostgreSQL/PGlite: migration, tenant RLS, graph JSON round-trip, denied client writes/RPCs, private object visibility, atomic versions, idempotency and invitation binding.
- Engine: legacy and graph-driven $100,000 marketing lifecycle, threshold branches, rejection/revision/cancellation, role/person checks, evidence, integer arithmetic, immutable graphs and invalid-path rejection.
- Browser: published the marketing canvas; created a review workflow; dragged a document from the palette; configured roles/instructions; duplicated/deleted nodes; reordered steps; connected success and rejection branches; exercised zoom, validation errors and reload persistence.
- Live Supabase through both the local app and the production URL: two real synthetic accounts, signup-token confirmation, password login, separate workspaces, graph persistence, transitions, rejection/resubmission, retries, stale versions, private upload/signed download, denied public files, denied cross-tenant API/database/storage access and denied finance approval by a Requester. Test records were removed.
- Production client bundles contain neither Supabase credential value.

## Configuration remaining

**Email delivery:** The live tests generate signup confirmation tokens without sending email. End-to-end delivery has not been tested. Configure custom SMTP in Supabase Authentication → Emails before public registration: the default service only sends to organization team addresses and imposes strict limits ([Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp)). Email confirmation remains enabled.

**OpenAI:** No OpenAI API key is configured. AI Agent nodes use the existing analysis flow; the demo adapter remains explicitly simulated. Workspace AI requires the existing OPENAI_API_KEY setup.

No Gmail, Slack, Xero, payment or bank connector was added. Graph execution remains one active node at a time, with controlled revision loops and no parallel fan-out.

## Deployment

Existing production URL: https://financeflow-prototype-gules.vercel.app

Deployed from `main` to the existing Vercel project. The public bootstrap endpoint reports workspace services enabled, `/prototype` returns HTTP 200, and the six live smoke-check groups pass against the production origin. The live canvas was opened in the browser; its initial viewport is fitted after all nodes have been measured. Synthetic production test records were removed.
