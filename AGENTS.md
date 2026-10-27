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

- Interest intake uses a shared Zod schema and a public insert-only server function for cotas_interesses; the table has no anon/authenticated privileges or policies. Why: visitors can submit without signing in but cannot retrieve customer details or change records.

- AI Gateway calls go through `src/lib/ai/responses.server.ts` (server-only, `*.server.ts`): it owns `createResponsesCall` (provider per request, run-ID fetch from `src/lib/ai/run-id.ts`, reasoning options). Server functions expose results via `src/lib/*.functions.ts` and never import the AI module from route files. Why: keeps `LOVABLE_API_KEY` and prompts off the client bundle.
- Shared page data (tiers, priorities) lives in `src/lib/cotas.ts` and is imported by both the index route and server functions; do not duplicate it in components. Why: server prompt and UI must always show the same tier data.

- AI assistant interactions are logged server-side to historico_ia inside analyzeCota (service role, no client privileges/policies); logging failures never block the answer. Why: visitors cannot read or forge the log.
