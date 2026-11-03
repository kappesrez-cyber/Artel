<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

- Product: ПромПул, a B2B platform for finding domestic replacements for imported components (see README).
- Run `npm run check` before committing; CI runs the same checks plus a build and Docker image.
- Server-only code lives in `src/server/` and imports `server-only`. Read env through `env()` from `src/server/env.ts`.
- Schema changes: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name <name>` and commit the migration.
- User-facing text is in Russian.
- Catalog reads/writes go through `src/server/catalog` (keeps `searchText` and ownership checks in one place).
- Auth lives in `src/server/auth`: DB sessions in an httpOnly cookie. Pages call `requireOrganizationUser()` inside `<Suspense>`; API routes call `authorizeOrganization(orgId, { seller })`; every Server Action re-checks the session.
- Deals and reviews go through `src/server/deals` (status rules in `transitions.ts`); reviews only for COMPLETED deals.
- Orders (market) go through `src/server/orders`; star balance changes only in `src/server/stars/stars.ts` (atomic, CHECK >= 0). Payments: `PaymentProvider` in `src/server/stars/payments.ts`, `stub` for now.
- Don't build className strings from constants exported by `"use client"` files (`${buttonClass} …`) in Server Components: they arrive as client references, not strings.
- Preview deploys: Vercel + Neon, build command `npm run vercel-build` (migrate, seed, build). Demo logins are in README.
- Amvera (RU hosting): `amvera.yml` + `Dockerfile`; env vars are not available at build, so `scripts/docker-start.sh` runs migrate + seed at container start. Keep build DB-free.
