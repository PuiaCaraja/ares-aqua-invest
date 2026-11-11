<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- Abuse protection: `rate-limit.server.ts` must run before AI provider calls and before lead/VIP inserts. Counters are atomic PostgreSQL RPCs from migration `0006_abuse_protection.sql`, callable only by service_role. Missing configuration or RPC errors fail closed. Trust IP headers only behind a proxy that overwrites them; keep limits and HMAC secret server-side. Honeypot metadata must never be inserted into business tables.

- Interest intake uses a shared Zod schema and a public insert-only server function for cotas_interesses; the table has no anon/authenticated privileges or policies. Intake functions (leads, VIP reservations, AI log) attach `user_id` only from a server-verified bearer via `src/lib/optional-user.server.ts`. Why: visitors can submit without signing in but cannot retrieve customer details, change records, or forge ownership.

- Client accounts: public email/password + magic-link sign-up is enabled; the client dashboard (`/_authenticated/minha-conta`) reads its own rows through `minhaConta` (requireSupabaseAuth, then service-role queries filtered by the verified user id / confirmed email). Why: tables stay locked to clients while each client sees only their data.

- Post-submit success uses `SucessoAssistente` (simulated welcome chat + WhatsApp link from `src/lib/whatsapp.ts`); the support number lives only in `WHATSAPP_NUMBER`. Why: one place to change the support channel.

- AI Gateway calls go through `src/lib/ai/responses.server.ts` (server-only, `*.server.ts`): it owns `createResponsesCall` (provider per request, run-ID fetch from `src/lib/ai/run-id.ts`, reasoning options). Server functions expose results via `src/lib/*.functions.ts` and never import the AI module from route files. Why: keeps `LOVABLE_API_KEY` and prompts off the client bundle.
- Shared page data (tiers, priorities) lives in `src/lib/cotas.ts` and is imported by both the index route and server functions; do not duplicate it in components. Why: server prompt and UI must always show the same tier data.

- AI assistant interactions are logged server-side to historico_ia inside analyzeCota (service role, no client privileges/policies); logging failures never block the answer. Why: visitors cannot read or forge the log.

- /admin is private. Every admin server function must use requireSupabaseAuth and requireAdministrator, backed by get_account_role with the verified caller's bearer. Migration 0007 selects one confirmed owner in app_private.administrator_settings, enforces one role per user and at most one admin, and assigns every other signup the user/client role. Never restore public lead reads, first-user promotion, client-controlled roles, or an admin checkbox in account creation. The owner signs up/signs in through /auth; it does not require an existing admin to provision its role.

- VIP bar reservations follow the same intake pattern as cotas_interesses: shared Zod schema (`src/lib/reserva-schema.ts`), public insert-only server function `registrarReserva`, table `reservas_vip` with no anon/authenticated privileges or policies. Why: visitors can book without signing in but cannot read or change reservations.
