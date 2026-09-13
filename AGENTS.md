<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back into Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Base44 Development Environment

### Stack
- **Runtime**: Bun (`oven/bun:1` Docker image)
- **Framework**: TanStack Start (SSR) + Vite + React 19
- **Backend**: Supabase (remote hosted — no local DB needed)
- **Package manager**: Bun (`bun.lock`, `bunfig.toml`)

### Running the app
```sh
docker compose -f docker-compose.base44.yml up -d
```
The Vite dev server runs on port 3000 with live reload. Source is bind-mounted at `/app`.

### Environment variables
- **Publishable (public) keys** (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_*`): committed in `.env` and delivered via `/run/base44/app.env`.
- **`SUPABASE_SERVICE_ROLE_KEY`**: secret — user-provided via dashboard. Required for server-side admin operations (the `supabaseAdmin` client in `src/integrations/supabase/client.server.ts`). Loaded lazily via a Proxy, so the app boots even if missing, but server functions will throw.

### Verification
- `curl http://localhost:3000/` returns 200 with SSR HTML (title: "EarnVerse — Watch, Work & Earn Daily Rewards").
- Dev server logs show Vite compilation warnings (deprecation notices for `inputValidator`), not errors.
