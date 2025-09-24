# LY Inspire — Design Inspiration Platform

LY Inspire is a Next.js application that curates and showcases design inspirations from multiple sources (Behance, Dribbble, Medium, Core77, Awwwards). It includes a public site, searchable archive, community submissions, an admin dashboard, and Python scrapers with a daily scheduler.

## Highlights

- Daily curation with “Award Pick” and Top 10
- Searchable archive with filters (search, platform, tags, date)
- Admin dashboard (stats, moderation, award pick override, tools)
- Community submissions with approval flow
- Dark/light theme and responsive UI
- Python scrapers + scheduler (03:00 IST) and GitHub Actions workflows

## Tech Stack

- Web: Next.js (App Router 13.5), TypeScript, TailwindCSS, shadcn/ui, next-themes
- API: Next.js route handlers
- Data: Prisma ORM + PostgreSQL
- Auth: JWT (jsonwebtoken) + bcryptjs, role-based (admin/user)
- Validation: zod
- UI Icons/UX: lucide-react
- Scrapers: Python (requests, BeautifulSoup, Playwright)
- CI/CD: GitHub Actions (CI pipeline + scheduled scraper) and optional Vercel deploy

## Local Setup

Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ (local or Docker)
- Python 3.11+ (only if running scrapers locally)

Steps
1) Install dependencies
   - `npm install`
2) Configure environment
   - `cp .env.example .env`
   - Edit `.env` with database URL, JWT secret, and optional scraper tokens
3) Database migrate and seed
   - `npm run db:migrate`
   - `npm run db:seed`
     - Seeds an admin user using `ADMIN_EMAIL`/`ADMIN_PASSWORD` and sample inspirations (see `lib/seed.ts`).
4) Start the dev server
   - `npm run dev`
   - App runs at `http://localhost:3000`

Docker (recommended, one command)
- `docker-compose up`
  - Starts: Postgres, Next.js dev server, and the Python scraper scheduler container.

## Environment Variables

See `.env.example` for the full list. Key variables:
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — JWT signing key
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — Admin created during seeding
- `BEHANCE_API_KEY`, `DRIBBBLE_ACCESS_TOKEN` — Optional, used by scrapers
- `NEXT_PUBLIC_APP_URL` — Public base URL

## Scripts

- `npm run dev` — Run Next.js dev server
- `npm run build` — Build production bundle
- `npm start` — Start production server
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript type check
- `npm run db:generate` — Generate Prisma client
- `npm run db:migrate` — Run Prisma migrations (dev)
- `npm run db:seed` — Seed DB via `lib/seed.ts`
- `npm run db:studio` — Open Prisma Studio

## Project Structure

```
app/                  # Routes (App Router)
  api/                # API route handlers (REST-style)
  admin/              # Admin dashboard (client components)
  archive/            # Archive listing + filters
  inspiration/[id]/   # Inspiration detail + related
  submit/             # Community submission form
components/           # UI + feature components (shadcn/ui-based)
hooks/                # Custom hooks (e.g., use-auth)
lib/                  # Auth, Prisma, seeds, utils, mock-data
prisma/               # Prisma schema and migrations
scrapers/             # Python scrapers, scoring, scheduler
types/                # Shared TypeScript types
```

## Data Model (Prisma)

Tables
- `users` — id, email (unique), password (bcrypt), role, name
- `inspirations` — curated design items with `score`, `tags[]`, `platform`
- `submissions` — community submissions (pending/approved/rejected)
- `daily_curations` — per-day curated `awardPickId` and `top10Ids[]`

See `prisma/schema.prisma` for full details.

## API Overview

Public
- `GET /api/today` — Returns `{ awardPick, top10 }` for the day; lazily creates a `daily_curations` entry if missing.
- `GET /api/inspirations` — List inspirations with filters and pagination.
  - Query params: `search`, `platform`, `tags` (comma-separated), `date` (`today|week|month|year`), `page`, `limit`.
- `GET /api/inspirations/[id]` — Single inspiration details.
- `GET /api/inspirations/[id]/related` — Related by platform/tags.
- `POST /api/submissions` — Create a submission. Body schema (zod):
  - `{ title, description?, contentUrl, submitterName, submitterEmail, platform, tags[] }`

Auth
- `POST /api/auth/login` — Body `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — Requires `Authorization: Bearer <token>`

Admin (Bearer token + `role=admin`)
- `GET /api/admin/stats` — Dashboard metrics (partially mocked)
- `GET /api/admin/submissions` — Pending submissions
- `PATCH /api/admin/submissions/[id]` — `{ status, rejectionReason? }`; creates an `inspiration` on approval
- `GET /api/admin/inspirations` — Recent inspirations
- `POST /api/admin/award` — `{ inspirationId }` sets today’s Award Pick
- `POST /api/admin/ingest` — Stub to trigger scraping job (logs only)

Auth Notes
- JWTs are generated server-side and stored in `localStorage` by the client (see `hooks/use-auth.ts`).
- Protect admin-only endpoints using Bearer token; the admin UI handles login/logout.

## UI Notes

- Routes: `/` (home), `/archive`, `/submit`, `/inspiration/[id]`, `/admin`.
- The archive grid fetches from `/api/inspirations` with filters.
- The admin dashboard shows stats, moderates submissions, sets Award Pick, and can trigger a manual scrape (stubbed endpoint).
- Homepage components (`AwardPick`, `TopInspirations`) currently use `lib/mock-data.ts` for demo data. The backend implements `/api/today`; swap to the API when real data is available.

## Scrapers and Curation

Location: `scrapers/`
- Sources: Behance, Dribbble, Medium, Core77, Awwwards
- Key files: `*_scraper.py`, `scoring.py`, `curation.py`, `scheduler.py`, `database.py`
- Scheduler: `scheduler.py` runs daily at 03:00 IST (see GitHub Action and Docker service)

Run locally (optional)
```
cd scrapers
python -m venv .venv && source .venv/bin/activate  # or your preferred env
pip install -r requirements.txt
python scheduler.py
```

Dockerized scraper
- Included as `scraper` service in `docker-compose.yml` (runs continuously with the scheduler)

CI workflow scraper
- `.github/workflows/scraper.yml` runs the scrapers on a schedule and can be dispatched manually. Set `DATABASE_URL`, `BEHANCE_API_KEY`, `DRIBBBLE_ACCESS_TOKEN` as GitHub secrets.

Scoring
- See `scrapers/scoring.py` for the scoring breakdown used during ingestion.

## CI/CD

GitHub Actions
- `.github/workflows/ci.yml` — Lint, type-check, migrate, build, and test on PRs and pushes. Deploy step uses `amondnet/vercel-action` when pushing to `main`.
- Required secrets for deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Vercel (optional)
- Create a Vercel project, connect the repo, and configure env vars (`DATABASE_URL`, `JWT_SECRET`, etc.).
- This repo does not include a `vercel.json`; default settings are sufficient for Next.js.

## Deployment (Docker)

Production image
- `Dockerfile` builds a production image for the Next.js app

Compose (dev)
- `docker-compose.yml` spins up Postgres, app (dev), and scraper

## Development Tips

- Prisma Studio: `npm run db:studio`
- Images: Next Image is set `unoptimized: true` and allows Pexels/Dribbble/Behance domains (see `next.config.js`).
- Tailwind/shadcn: UI components live under `components/ui` and follow shadcn patterns.

## Testing

- Jest is configured; add tests under a `__tests__/` folder and run:
  - `npm test` or `npm run test:watch`

## Security & Config

- Change all defaults in `.env` for production (especially `JWT_SECRET`).
- Restrict admin credentials and rotate tokens/keys regularly.

## License

- No LICENSE file found. Add one (e.g., MIT) to clarify usage.


---

Built with ❤️ using Next.js, Prisma, and modern web technologies.
