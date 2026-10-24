# FinanceFlow prototype

Interactive, local-only mock of a $100,000 US marketing funding workflow for Northstar Cloud. All approvals, documents, insights, and balances are simulated. No account, backend, integration, or real transfer is involved.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Run `npm run build` to verify the production build.

## Edit the workflow

`lib/workflow.ts` contains the ordered `STAGES` array, document previews, campaign details, and the initial demo state. Add, remove, or reorder stage objects in `STAGES`; the timeline and progress use that array. Give a stage a unique `id`, and optionally a `documentId` matching a document in `DOCUMENTS`. If adding approval stages, set `kind: 'approval'`. Update `initialState()` when changing the desired opening scenario. The main interaction logic is in `components/FinanceFlow.tsx`.

## Assumptions

Finance and management review precede the fictional partner request. A purchase order is required before invoice processing. Management approval counts as approved internal funding; the simulated wallet balance becomes available once Treasury confirms funding. The wallet is not debited on handoff. The partner process is hypothetical and does not represent any actual provider's policy.

## Team and AI starting point

Read [Shared idea guidelines](docs/IDEA_GUIDELINES.md), [Product specification](docs/PRODUCT_SPEC.md), and [Teammate handoff](docs/HANDOFF.md) before extending the demo. [AGENTS.md](AGENTS.md) gives repository-level instructions to AI coding tools. The guidelines include a reusable prompt for tools that do not load those instructions automatically.

Public repository access shares the source, not a hosted demo. Clone the repository, run `npm ci`, then `npm run dev` to explore it locally. Use one branch per change and review changes against the agreed prototype scope.
