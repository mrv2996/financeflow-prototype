# Deploy FinanceFlow

## Local development

Use Node 22+ and npm. In a fresh clone:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With blank environment values the public demo, visual builder, and simulated workflows work immediately. Private workspace APIs report configuration errors instead of fake success.

For validation, stop the dev server first (it shares .next with the build), then run:

```bash
npm run typecheck
npm test
npm run build
npm start
```

## Supabase setup

1. Create a dedicated Supabase project. In Project Settings / API, copy the project URL, anon/publishable-compatible legacy anon key, and service role key into the variables below. The service role key is server-only and bypasses RLS; never put it in a NEXT_PUBLIC variable or a client bundle.
2. Open SQL Editor and run the full contents of supabase/migrations/202610240001_financeflow.sql once. Alternatively, link the Supabase CLI to the project and run `supabase db push`.
3. The migration creates the finance tables, tenant read policies, controlled server write functions, profile trigger, and private financeflow-documents bucket. Do not make the bucket public or add client write policies to the workflow tables.
4. In Authentication / Providers enable email/password. Keep email confirmation enabled for shared deployments. Configure a mail provider for reliable sign-up delivery if the default email service is insufficient.
5. In Authentication / URL Configuration, set Site URL to your Vercel production origin. Add both `http://localhost:3000/auth/confirm` and `https://YOUR-DEPLOYMENT/auth/confirm` to allowed redirect URLs. The app exchanges confirmation codes server-side. A custom confirmation email template may use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` for server-side verification across devices.
6. Register in the app, confirm email, sign in, and create a workspace. Starter templates are added. Start an instance; its data will then persist in PostgreSQL across refreshes and deployments.
7. Invite another email through Roles & people, share the generated link yourself, and sign in using that email to accept it. The invited person must already have or create an account. No message is sent automatically.

## Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| SUPABASE_URL | Workspace mode | Project URL; server reads it |
| SUPABASE_ANON_KEY | Auth and RLS-scoped reads | Server-side auth client; no browser client is used |
| SUPABASE_SERVICE_ROLE_KEY | Controlled writes and private storage | Secret, server-only |
| OPENAI_API_KEY | Real assistant and extraction | Secret for the desired OpenAI API project; billing/access must be active |
| OPENAI_MODEL | Optional model override | Default gpt-4.1-mini; use a compatible Responses model available to your API project |

There are no NEXT_PUBLIC credentials. No Supabase/OpenAI secrets were available during implementation. Do not paste secret values into issue comments, commits, or public AI transcripts.

## Vercel

1. Import the existing GitHub repository into Vercel. Select Next.js, repository root `.`, and Node 22.x. Deploy the branch containing the v0.2 implementation (feature/workflow-platform until it is merged).
2. Add the environment variables in Project Settings → Environment Variables, selecting the appropriate Production/Preview environments. Keep preview deployments pointed at a separate Supabase project if they will receive real private data.
3. Deploy. The application builds without environment variables and serves Demo mode; workspace/AI features become available only after service configuration. Redeploy after changing variables.
4. Configure the final Vercel origin in Supabase Auth as described above.
5. Verify the actual production URL. Never treat a local URL or build log as proof that a public deployment is working.

## Live acceptance checklist

- Anonymous visitor: demo visible, builder works, role switch is labeled simulated, refresh retains that browser's demo.
- Account A: register/confirm/login, create workspace/template/instance, attach and review a small document, progress, refresh and reopen.
- Account B in a different workspace: cannot read A's instances, documents, messages, or signed files; direct mutation RPCs/client table writes are denied.
- Invite B into A's workspace with only Requester: B can submit evidence but cannot approve a finance/CFO stage. Assign the finance role and verify behavior changes only where appropriate.
- Reject and resubmit; retry an identical action; send a stale version; verify no skipped controls or duplicate financial effects.
- With OpenAI configured: ask about a stored blocker, inspect evidence references, confirm an internal follow-up proposal, and verify received funds remain unchanged.
- Upload a PDF/CSV/XLSX, extract it, review fields, and verify an amount/currency mismatch blocks progression. Review AI output against the original file.

## Operational constraints

Uploads are capped at 4 MB for Vercel request limits. The AI loop is bounded and rate-limited per authenticated user; OpenAI spend limits should also be set in the API project. Supabase and OpenAI quotas, email delivery, and billing are external configuration. No background job, local disk persistence, real treasury integration, or external sending service is used.

Documentation references: [Supabase server auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), and [file inputs](https://developers.openai.com/api/docs/guides/file-inputs).
