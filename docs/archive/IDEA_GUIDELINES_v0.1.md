# Shared idea guidelines

Read this before asking an AI to change FinanceFlow. This is the common product brief for both teammates.

## The idea we are protecting

FinanceFlow is a rapid visual prototype of a company's approximately $100,000 US marketing funding journey: request, budget review, possible external co-marketing funding, campaign plan and budget, approvals, purchase orders, invoices, funding confirmation, and marketing handoff. Campaign execution may produce events and whitepapers.

Our near-term goal is to see and discuss the entire process, discover responsibilities and ordering, and decide where automation helps. The workflow is deliberately hypothetical. Mentioning AWS as a possible co-marketing example or Round Treasury as the buildathon sponsor does not establish a real integration or verified provider process.

## Non-negotiable prototype boundaries

1. Keep it a single-page interactive experience with mocked data and local React state.
2. Keep the full lifecycle visible and clickable; do not reduce it to a static mockup.
3. Every visible action must work locally and have a clear result.
4. Preserve dashboard totals, stage details, simulated agent guidance, document previews, blockers, and Reset Demo.
5. Calculate financial figures deterministically from workflow state; do not invent amounts with AI.
6. Label actions, balances, documents, and agent responses as simulations.
7. Add no authentication, database, backend, API integration, environment-variable requirement, real payment, upload, or actual document generation.
8. Reuse Next.js, React, TypeScript, and Tailwind; add dependencies only when essential to the requested UI.
9. Keep the interface professional and light; favor clarity over charts, animation, and decoration.
10. Prefer a small, understandable implementation over a framework for speculative future needs.
11. Treat owners, thresholds, external funding behavior, and stage order as editable assumptions.
12. Stop when the requested prototype change works. Do not add adjacent features without a request.

## Decisions versus assumptions

The $100,000 fictional campaign and complete visible lifecycle are the demonstration target. The current $75,000 threshold, sequential stage order, internal approval semantics, and timing of wallet funding are prototype assumptions documented in PRODUCT_SPEC.md. They are not financial, legal, or provider policy.

When changing an assumption, state the new assumption and update the specification. If a request explicitly changes a boundary, identify that scope change and update these guidelines rather than silently drifting. An ordinary UI or workflow refinement does not authorize live integrations or production infrastructure.

## How we work with AI

Start a focused task on a branch. Tell the AI the exact outcome and acceptance checks. Ask it to read AGENTS.md and the documents listed there before editing. Keep changes tied to the request; preserve unrelated working behavior. After a material workflow change, check the complete funding path and reset, plus rejection or missing-document behavior when affected.

Use this prompt with any AI tool (some tools do not automatically read AGENTS.md):

> Work on FinanceFlow. First read AGENTS.md, docs/IDEA_GUIDELINES.md, docs/PRODUCT_SPEC.md, and docs/HANDOFF.md. This is a local mock prototype for discussing a $100,000 marketing funding lifecycle. Keep the documented scope and simulated behavior. Implement this specific change: [CHANGE]. Acceptance checks: [CHECKS]. State any changed assumptions, update the relevant docs, verify the affected flow, and stop when it works. If the request explicitly changes the agreed scope, call out that change before implementing it.

These files guide AI tools; they cannot guarantee that every model follows instructions. Both teammates should review diffs against the acceptance checks.
