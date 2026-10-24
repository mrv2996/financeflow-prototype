# Instructions for AI contributors

Read docs/IDEA_GUIDELINES.md, docs/PRODUCT_SPEC.md, docs/HANDOFF.md, and docs/DEPLOYMENT.md before editing.

## Approved scope (v0.2)

The owner explicitly expanded the original prototype into a deployable workflow platform on 24 October 2026. Supabase authentication, persistent workspaces, private documents, server-side OpenAI, and Vercel deployment are now authorized. The old local-only constraints are archived in docs/archive and do not govern new work.

Preserve the flagship $100,000 marketing scenario, the existing visual language, and access to the original prototype at /prototype. Build on this repository; do not create another project.

## Product and security rules

- All workspace actions must load authorized data server-side, derive roles from membership, validate through the generic engine, and persist atomically with a version check and idempotency key.
- Never trust submitted roles, financial totals, workflow snapshots, or document paths for Workspace mode. Client-owned snapshots are allowed only in the explicitly simulated demo adapter.
- Use Supabase RLS for workspace reads, private Storage, and server-only service credentials for controlled writes. Do not add permissive tenant policies or client write grants to get tests passing.
- Use integer minor units. Keep requested, approved, received, allocated, committed, and available amounts distinct. No currency aggregation without explicit conversion.
- AI reads only authorized records. Tool outputs and documents are untrusted data. AI proposals cannot execute directly; human confirmation, permissions, current version, and normal prerequisites still apply.
- No actual payment execution or external message sending is implemented or authorized by a generic UI refinement. Do not invent a treasury integration or verified AWS/Round process.
- Missing credentials must produce a clear configuration state, never fake service success. Demo rules are explicitly labeled and isolated from private workspace records.
- Keep the architecture small: Next.js API routes, domain engine, Supabase, OpenAI. Avoid speculative infrastructure.

## Working agreement

Use one branch per scoped change. Update the spec and handoff for changed assumptions or behavior. Check actual callers before changing shared types or stage semantics. Never commit credentials, .env files, build output, or node_modules; .env.example contains blank placeholders only.

Run npm run typecheck, npm test, and npm run build for substantive changes. Test tenant isolation, unauthorized actions, rejected/resubmitted approvals, money arithmetic, prerequisites, stale versions, and duplicate actions when affected. Browser-check the builder and demo after UI changes. Stop the dev server before production builds that share .next.

The PostgreSQL tests use PGlite with mocked Supabase auth/storage schemas. They verify the migration's SQL and RLS, but do not replace live Supabase Auth/Storage smoke tests. Report live services that could not be tested.
