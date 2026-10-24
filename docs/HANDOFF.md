# FinanceFlow — teammate handoff

Updated 24 October 2026. Read IDEA_GUIDELINES.md and PRODUCT_SPEC.md before extending the prototype.

## What is ready

A working Next.js single-page demo for Northstar Cloud's $100,000 US Growth Summit 2026 campaign. It includes Overview, Workflow, and Documents views; ten interactive stages; approvals and rework; missing-document blocking; eight mock document previews; a conditional finance-agent panel; calculated financial cards; activity messages; and Reset Demo.

No external service is connected. Public repository access shares the source code; it does not host a live web demo. Each teammate runs the app locally.

## Get started

Use Node.js 22 or newer and npm. From a clone of the repository:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. State resets on reload. Stop the dev server before running the production build:

```bash
npm run typecheck
npm run build
npm start
```

The last command serves the built app locally. Do not run both servers on the same port.

## Source map

| File | Purpose |
| --- | --- |
| lib/workflow.ts | Campaign details, ordered STAGES, mock DOCUMENTS, types, initial state |
| components/FinanceFlow.tsx | Dashboard, views, stage actions, computed money, agent rules, document modal |
| app/page.tsx | Mounts the interactive app |
| app/layout.tsx | Page metadata and global styles |
| app/globals.css | Base styling and Tailwind layers |
| tailwind.config.ts | Palette, layout tokens, source scanning |
| AGENTS.md | Repository instructions for AI contributors |
| docs/IDEA_GUIDELINES.md | Original intent, limits, and reusable AI prompt |
| docs/PRODUCT_SPEC.md | Product behavior, assumptions, and acceptance walkthrough |

## Modify stages carefully

The STAGES array controls display order and sequential progression. Add, remove, or reorder its objects; each stage needs a unique ID, owner, action, description, and kind. A documentId must match DOCUMENTS. Use kind `approval` for decision stages, `document` for evidence steps, or `milestone` for other actions.

Also update initialState, documents, and the acceptance walkthrough as needed. The initial state currently completes the first two array entries and activates the third. Some financial and agent logic directly references IDs (`finance`, `management`, `partner`, `funding`, `po`, `handoff`), and the initial selected stage is `finance`. Renaming or removing these requires updating those references. Reordering can change when funding becomes available, so inspect the money rules as well as the timeline.

## Demo walkthrough

Approve Finance, then management. Complete the partner request. Attempt PO completion without its document to see a blocker; create the demo PO through the stage control or agent suggestion. Close its preview and complete the stage. Create and process the invoice. Approve the partner request. Create the funding confirmation, confirm demo funding, and complete the marketing handoff. The final available balance is $100,000. Reset returns to the opening scenario.

For rework, choose Request changes or Reject during an active approval, then resubmit or approve. The prototype intentionally permits an approver to override a blocked decision by approving; this is not a production authorization design.

## Verification performed

The initial prototype passed TypeScript checking and a production build. A browser walkthrough covered finance and management approval, change request and resubmission, missing PO blocking, agent-assisted PO creation, invoice creation, partner approval, funding confirmation, handoff, document centre, and reset. All ten stages reached completion and available balance reached $100,000. Final document labels were checked after correction.

## Known prototype limitations

- State is session-local: reload discards changes; no multi-user collaboration or saved audit trail.
- Amount, campaign, threshold, dates, and previews are hardcoded.
- The finance agent uses conditional messages, not an LLM. It cannot reason about arbitrary requests.
- Document creation makes a mock preview available; no downloadable document is generated.
- Only the first unfinished stage can progress; parallel approvals are not modeled.
- The agent/detail column moves below the timeline on narrower screens.
- Document modal accessibility is basic; focus trapping and Escape handling are not implemented.
- There is no automated end-to-end test suite. Avoid adding infrastructure just for ideation.

## Team working agreement

Use one branch per scoped change. Review the diff against the shared guidelines and product specification before merging. Include what changed, any updated assumption, and how it was checked. Keep secrets and real financial/customer data out of this public prototype.
