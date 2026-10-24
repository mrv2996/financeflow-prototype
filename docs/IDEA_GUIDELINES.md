# Shared idea guidelines — FinanceFlow v0.2

Updated 24 October 2026. This file is the shared product intent for both teammates and their AI coding tools. The original v0.1 brief is archived in archive/IDEA_GUIDELINES_v0.1.md.

## The idea

FinanceFlow is an AI-powered financial workflow coordinator. It helps employees, managers, finance teams, and external stakeholders manage requests, approvals, documents, policy checks, and handoffs. It complements treasury infrastructure such as Round Treasury; it does not rebuild banking or payment rails.

The flagship scenario remains a fictional $100,000 US marketing campaign for Northstar Cloud. Responsibilities and partner funding order are hypotheses, not verified AWS or other provider policy.

## Explicitly approved scope change

The owner requested a functional, deployable application instead of the initial local-only prototype. The following are now in scope: UI-created workflows, reusable templates, saved instances, Supabase Auth/PostgreSQL/private Storage, custom roles, server-enforced approvals, real OpenAI reasoning and extraction, persistent history, and Vercel deployment. These replace the old prohibitions on accounts, persistence, APIs, and uploads.

Keep two visibly distinct modes. Demo mode is isolated browser data and simulated role switching. Workspace mode has real accounts and private database records. Missing service configuration must remain visible, and must never be represented as a functioning real integration.

## Principles that must not drift

1. Keep the complete funding lifecycle visible and usable. Preserve the original sample and light fintech design.
2. Let users configure workflows through the UI. Use the existing generic engine with validated canvas transitions, approval, rejection, revision, and threshold conditions.
3. The backend decides whether real workspace actions are permitted. Role and document prerequisites cannot be bypassed by a button or model output.
4. Treat approved requests, funding receipts, allocations, commitments, and available budget as different concepts. Use deterministic integer minor-unit arithmetic.
5. Approval is not receipt, an invoice is not payment, and a draft follow-up is not a sent message.
6. AI may explain, extract, draft, and propose. Humans explicitly confirm material changes; the workflow engine still checks them.
7. Scope every real data read and write to the authenticated workspace. Keep files private and credentials server-side.
8. Keep the flagship partner process hypothetical. Do not imply real AWS, Round, Xero, or bank connectivity without an implemented authorized integration.
9. Prioritize reliable P0 workflow, persistence, and permission behavior over optional email, Slack, or treasury integrations.
10. Build on this repository, keep architecture straightforward, and stop when the requested outcome is verified.

## Defaults versus decisions

Current defaults are a sequential starter path editable on the visual canvas, a $75,000 CFO escalation for the marketing sample, administrators managing templates/roles, explicit person assignment where needed, and one currency per instance. The owner starts with all default business roles; administrator status alone does not override approval roles. A received-funding entry is an authorized manual record backed by reviewed evidence, not a verified bank feed.

Changes to these assumptions belong in PRODUCT_SPEC.md. Explicit product scope changes should update this document and AGENTS.md. Routine feature requests do not authorize unrelated integrations or data exposure.

## Prompt to use with an AI tool

> Work in the existing FinanceFlow repository. Read AGENTS.md, docs/IDEA_GUIDELINES.md, docs/PRODUCT_SPEC.md, docs/HANDOFF.md, and docs/DEPLOYMENT.md first. Implement this change: [CHANGE]. Preserve the marketing demo, generic engine, workspace isolation, server-side permissions, integer money calculations, evidence review, and human confirmation. Acceptance checks: [CHECKS]. Update affected docs, run relevant tests, identify any unverified external service, and stop once the change works. Do not claim a live integration is operational when it is unconfigured.

These instructions reduce drift; both teammates still review code and behavior against the agreed scope.
