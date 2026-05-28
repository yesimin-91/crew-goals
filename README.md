# crew-goals

Crew Goals MVP monorepo skeleton with:

- `apps/web`: React + TypeScript + Vite frontend
- `apps/api`: Fastify + TypeScript backend
- `packages/shared`: shared UI/API entry types
- `packages/db`: SQLite bootstrap and Drizzle schema

## Start

1. Install dependencies

```bash
npm install
```

2. Run frontend and backend together

```bash
npm run dev
```

3. Open the app

- Frontend: `http://localhost:5173`
- API health: `http://localhost:3001/api/health`

## Notes

- The SQLite file is created automatically at `apps/api/data/crew-goals.sqlite`.
- The current frontend includes one formal entry page wired to the backend `GET /api/home-entry`.
