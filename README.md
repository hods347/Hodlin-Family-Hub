# 🏡 Hodlin Family Hub

A private home base for the Hodlin family — move-in prep, home projects, meal
planning, and babysitter schedules — built with Next.js, deployed on Vercel,
backed by Neon Postgres.

## Features

| Feature | What it does |
| --- | --- |
| 📦 **Move-In Prep** | A categorized checklist for the new house (utilities, address changes, safety/childproofing, cleaning, unpacking, admin, kids). Loads a curated 50+ item starter list tailored for a family with a toddler and a baby on the way. Track progress, priority, who's responsible, and due dates. |
| 🛠️ **Home Projects** | Home improvement planner. Paste inspection-report items to bulk-import them, then track priority, status, estimated cost & hours, and a target date. Each project with a date gets an **Add to Google Calendar** link and a downloadable **.ics** file for reminders. |
| 🍽️ **Meal Planner** | Save your favorite meals, then generate a week of dinners with one click (re-roll any day). Auto-builds a combined shopping list from the week's ingredients. |
| 🍼 **Baby Scheduler** | Build reusable daily sleep/feeding schedules for Parker (and soon baby #2) and **print a clean one-pager** to hand to babysitters. |
| 🏠 **Dashboard** | Countdown to the due date (Sep 9, 2026) and live move-in progress at a glance. |

## Tech stack

- **Next.js 16** (App Router, React 19, Server Actions) + **TypeScript** + **Tailwind v4**
- **Neon** serverless Postgres via **Drizzle ORM**
- Deployed on **Vercel**

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create a Neon database at https://neon.tech and copy its connection string
cp .env.example .env.local
#   then paste your connection string into DATABASE_URL

# 3. Create the tables and seed starter data
npm run db:push     # creates tables from the schema
npm run db:seed     # loads the move-in checklist, sample meals, kids & a schedule

# 4. Run it
npm run dev         # http://localhost:3000
```

> The app runs without a database too — data pages will show a "connect your
> database" prompt until `DATABASE_URL` is set, so you can preview the UI first.

## Database scripts

| Command | Description |
| --- | --- |
| `npm run db:generate` | Generate a SQL migration from `lib/db/schema.ts` (output in `drizzle/`). |
| `npm run db:push` | Push the schema directly to the database (fastest for getting started). |
| `npm run db:migrate` | Apply generated migrations. |
| `npm run db:seed` | Seed starter data (idempotent — skips tables that already have rows). |

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project → import the repo**. Framework preset: Next.js.
3. Add an environment variable **`DATABASE_URL`** = your Neon connection string
   (the Neon + Vercel integration can set this automatically).
4. Deploy. After the first deploy, run `npm run db:push && npm run db:seed`
   locally against the same `DATABASE_URL` (or use the Neon SQL editor with the
   generated migration in `drizzle/`) to create and seed the tables.

## Project structure

```
app/
  page.tsx              # dashboard
  move-in/              # 📦 move-in checklist (page + server actions)
  improvements/         # 🛠️ home projects (page, actions, .ics API route)
  meals/                # 🍽️ meal planner
  baby/                 # 🍼 babysitter schedules
  api/improvements/[id]/ics/route.ts   # calendar export
components/             # UI kit + per-feature client components
lib/
  db/                   # Drizzle schema, client, seed
  data/                 # default move-in checklist content
  utils.ts, nav.ts      # helpers + navigation config
drizzle/                # generated SQL migrations
```

## Ideas for later

A few additions that would fit naturally on top of what's here:

- **Shared shopping & grocery list** (the meal planner already produces one — make it persistent and editable).
- **Family calendar** combining baby schedules, project target dates, and appointments.
- **Important contacts** (pediatrician, contractors, plumber, neighbors) and a **document vault** (insurance, closing docs, warranties).
- **Home maintenance reminders** (HVAC filters, smoke-detector batteries) on a recurring schedule.
- **Budget tracker** for move-in and renovation spending vs. estimates.
- **Baby feeding/diaper logger** for the newborn months, and **growth/milestone tracking**.
- **Chore chart** as the kids grow, and a **packing list** generator for trips.
- Light **auth** (e.g. a shared family password or Vercel password protection) since this holds personal info.
