# Instructions for AI contributors

Before changing this repository, read these files in order:

1. docs/IDEA_GUIDELINES.md — shared intent and scope boundaries.
2. docs/PRODUCT_SPEC.md — expected behavior and acceptance walkthrough.
3. docs/HANDOFF.md — implementation map and known limitations.

FinanceFlow is a rapid, interactive, local mock prototype. Preserve the complete $100,000 marketing funding lifecycle, local working actions, deterministic totals, simulated finance-agent guidance, document previews, and Reset Demo.

Use the existing Next.js/React/TypeScript/Tailwind stack. Keep data hardcoded and state local. Do not add authentication, databases, external APIs, secrets, environment-variable requirements, real payments, file uploads, or real document generation unless a human explicitly changes the scope. Never treat the hypothetical partner flow as verified AWS or Round Treasury policy.

Implement the requested change with the smallest clear design. Avoid unrelated refactors and new features. Do not silently remove stages, controls, blockers, or demo labels. Update the product spec when behavior or assumptions change. Update the shared guidelines if the human explicitly changes a scope boundary.

Workflow configuration is in lib/workflow.ts. Interaction logic and dashboard figures are in components/FinanceFlow.tsx. Stage IDs such as finance, management, partner, funding, po, and handoff are also referenced in interaction logic; inspect those references before renaming or removing them.

Verify with npm run typecheck and npm run build when relevant. Browser-check affected approval, blocker, document, balance, and reset behavior for workflow changes. Do not run a build and a dev server against the same .next directory at once. Do not add tests that merely repeat implementation details.

Never commit node_modules, .next, credentials, local environment files, or machine-specific artifacts. Summarize changes, validation, and any remaining limitation at handoff. Stop once the requested result works.
