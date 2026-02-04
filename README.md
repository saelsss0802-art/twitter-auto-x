# Twitter Auto X

Phase1 starter for the Twitter（X）自動投稿システム.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 to confirm the app displays **Setup OK**.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

## Supabase Schema

1. Open the Supabase Dashboard for your project.
2. Go to **SQL Editor** and open a new query.
3. Paste the contents of `supabase/schema.sql` and run it to apply the schema.

## Cron API (Phase3)

Create cron-job.org jobs that call the Cron API endpoints with the shared secret.

### Run posting jobs (every 10 minutes)

- **URL**: `https://<your-domain>/api/cron/run-posting`
- **Schedule**: `*/10 * * * *`
- **HTTP Method**: `POST`
- **Request Header**:
  - `Authorization: Bearer <CRON_SECRET>`

## Knowledge Files (Phase5)

Knowledge Markdown files live under the `knowledge/` directory in this repo.

```
knowledge/
  types/
  templates/
  general/
```

### Knowledge API (auth required)

All knowledge endpoints require the `Authorization: Bearer <KNOWLEDGE_API_SECRET>` header.

- `GET /api/knowledge/types`
- `GET /api/knowledge/types/{typeId}`
- `GET /api/knowledge/general/x-algorithm`

### Fetch analytics (once per day)

- **URL**: `https://<your-domain>/api/cron/fetch-analytics`
- **Schedule**: `0 3 * * *` (example)
- **HTTP Method**: `POST`
- **Request Header**:
  - `Authorization: Bearer <CRON_SECRET>`
