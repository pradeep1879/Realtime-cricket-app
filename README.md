# Cricket Exchange

Bun-based cricket scoring app with an Elysia API, Prisma + PostgreSQL persistence, live WebSocket updates, and a Vite React scorer/viewer frontend.

## Stack

- Backend: Bun, TypeScript, Elysia, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind CSS, Zustand, shadcn-style UI components
- Real-time: Bun WebSockets via Elysia

## Project Structure

```text
backend/
  prisma/
  src/
    controllers/
    routes/
    services/
    sockets/
    utils/
frontend/
  src/
    components/
    hooks/
    lib/
    store/
```

## Local Setup

1. Install dependencies:

```bash
bun install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Configure backend env:

```bash
cp backend/.env.example backend/.env
```

4. Generate Prisma client and migrate the database:

```bash
cd backend
bunx prisma generate
bunx prisma migrate dev --name init
```

5. Start both apps:

```bash
cd ..
bun run dev
```

## Scripts

- Root: `bun run dev`, `bun run build`, `bun run start`
- Backend: `bun run dev`, `bun run build`, `bun run start`
- Frontend: `bun run dev`, `bun run build`, `bun run start`

## Match Flow

`CREATED -> TOSS_DONE -> INNINGS_1 -> INNINGS_BREAK -> INNINGS_2 -> COMPLETED`

## API Overview

- `GET /api/health`
- `POST /api/match`
- `POST /api/match/:id/toss`
- `POST /api/match/:id/start`
- `POST /api/match/:id/select-players`
- `POST /api/match/:id/ball`
- `POST /api/match/:id/ball/undo`
- `GET /api/match/:id/scorecard`

## Scoring Notes

- Scorecards are reconstructed from the `Ball` table rather than a stored total.
- Wides and no-balls do not increase legal ball count.
- Offline scorer submissions are queued in `localStorage`, replayed in order, and deduplicated with `clientEventId`.
- The add-ball payload supports `overthrowRuns`, `isDead`, wicket dismissal details, and delayed sync.
- Undo removes the latest ball and recomputes innings state from the remaining delivery log.
