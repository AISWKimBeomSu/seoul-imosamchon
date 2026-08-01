<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database changes go through migration files

Schema changes **must** be written to `supabase/migrations/NNNN_name.sql` and committed **before** being applied. Never change the schema from the Supabase dashboard — v1.0 did that and the repo ended up with no record of its own schema (see `docs/PLAN.md` §0.4, debt D1).

- Migrations are idempotent: `create table if not exists`, `drop policy if exists` before `create policy`.
- `0000_baseline.sql` records the pre-existing state. Do **not** re-run it on the live project.
- After applying, verify with `list_tables` that the DB matches the files.

## Project conventions (follow these; don't introduce new ones)

- **Styling is plain CSS** in `app/globals.css` using CSS custom properties. Tailwind sits in devDependencies but is unused — do not start using it.
- **Column naming**: `sort` (not `sort_order`), `pinned` (not `is_pinned`), `is_published`, `original_name`.
- **Rendering**: every page exports `dynamic = "force-dynamic"`. Do not mix in `use cache` / Cache Components without a deliberate, separate migration.
- **RLS pattern**: public read `using (is_published or public.is_admin())`; admin write `using/with check (public.is_admin())`.
- **The route is `/notice`** (singular). Older docs say `/notices` — they are wrong.
- **Every outbound link to a Google Form goes through `/api/go/[key]`**, never a raw `<a href>`. That route owns click tracking, closed-state handling, and URL validation. Adding a direct link silently breaks all three.

## Secrets

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never carry a `NEXT_PUBLIC_` prefix, and it is imported only in `lib/supabase/service.ts`, which starts with `import "server-only"`.
