# FinanceFlow — product specification

Version 0.1 · 24 October 2026 · Status: exploratory prototype

## Purpose

Help a company explore the complete approval and funding lifecycle for a $100,000 US marketing campaign. The immediate goal is a working visual conversation aid for a Finance & Ops AI buildathon sponsored by Round Treasury. Success means two teammates can click through the flow, discuss responsibilities, change the sequence, and identify useful automation within a 30-minute ideation session.

This is a hypothetical process. No workflow in this repository claims to represent verified AWS, Round Treasury, or other provider requirements.

## Scenario and people

Northstar Cloud requests $100,000 for US Growth Summit 2026 (MKT-US-0426). Marketing owns campaign planning and execution; Finance reviews the budget and processes invoices; management approves spend; Partnerships handles the external request; Procurement provides a purchase order; an external partner reviews funding; Treasury confirms the simulated wallet balance.

These responsibilities and their ordering are assumptions for discussion, not settled business rules.

## Current proposed lifecycle

| Stage | Responsible stakeholder | Required action or evidence |
| --- | --- | --- |
| Funding request | Marketing | Submit Marketing Funding Request |
| Plan & budget | Marketing | Submit Marketing Plan and Campaign Budget |
| Finance review | Finance | Explicit finance approval; produce Finance Approval |
| Management approval | VP, Marketing | Approve campaign spend |
| Partner funding request | Partnerships | Submit fictional co-marketing request |
| Purchase order | Procurement | Provide Purchase Order |
| Invoice processing | Finance | Create and process Invoice |
| Partner approval | External partner | Approve funding; produce External Partner Approval |
| Funding confirmed | Treasury | Record Funding Confirmation and load demo balance |
| Marketing handoff | Marketing | Accept the funded budget and campaign deliverables |

The original idea left the position of the external funding request, planning, and management review open. The current sequence is one editable interpretation.

## Required experience

- A professional fintech dashboard with sidebar, funding totals, pending approvals, current stage, and attention tasks.
- A complete clickable lifecycle with Completed, In Progress, Pending, and Blocked states. Details show owner, required action/document, and approval decision.
- Local actions for approval, rejection, change requests, mock document creation, completion, and progression. Every visible action has a meaningful effect.
- A simulated finance agent using deterministic conditional messages and suggested actions. It highlights approval thresholds, missing evidence, partner approval, and handoff readiness.
- A document centre with plausible previews for the eight named documents. Planned documents are distinguished from the deliberately missing PO.
- Reset Demo restores the opening scenario. Refresh also resets state because the prototype has no persistence.

## Financial and state rules

Requested funding is $100,000. Internal approved funding becomes $100,000 after management approval. Available balance becomes $100,000 only after Treasury confirms funding. Handoff does not spend or debit that balance. Pending approvals count unfinished approval stages, including future ones. The demo finance threshold is $75,000.

The first two stages begin complete; finance review is active; later stages are pending. Completing a stage activates the next stage. A missing required document blocks completion. Rejection or a change request blocks an approval until resubmission or a later approval. Approval creates its corresponding mock approval document.

Amounts and counts are calculated from state; simulated AI messages never calculate or mutate money independently of workflow actions.

## Scope boundaries

Use Next.js, React, TypeScript, Tailwind, hardcoded mock data, and local React state. Keep the architecture easy to edit. No login, database, backend service, external API, environment variable, real upload, real document generation, or payment processing. No AWS, Stripe, Xero, Round, or other live integrations. Essential UI packages only.

Use a white or light background, clear typography, generous spacing, color-coded status, and modest transitions. Avoid decorative charts, excessive animation, and unrelated features. Label simulated balances and actions clearly.

## Acceptance walkthrough

1. Open the app and see $100,000 requested, $0 approved, $0 available, two completed stages, and finance review active.
2. Request changes or reject an approval and see it become blocked; resubmit and approve to continue.
3. Approve Finance and management; approved funding becomes $100,000.
4. Complete the partner request; attempt to finish the missing PO stage and see a blocker.
5. Create the mock PO, preview it, and complete the stage. Create and process the invoice.
6. Approve partner funding, create the confirmation, and confirm demo funding; available balance becomes $100,000.
7. Complete marketing handoff; all ten stages are complete and no approval remains pending.
8. Inspect document previews and contextual agent messages, then reset to the initial state.

## Questions for later validation

- Who owns each real approval, and which approvals can run concurrently?
- Does external funding reimburse spend or arrive before spend?
- Is the partner funding the whole request or only part of it?
- What PO/invoice relationships, currencies, tax, and evidence requirements are actually needed?
- Which actions should AI recommend, prepare for review, or execute after explicit authorization?

Do not implement answers until the team chooses them. Changes to the idea must update this specification and the shared guidelines.
