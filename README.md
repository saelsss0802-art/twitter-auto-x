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

- `ADMIN_PASSWORD`: Admin login password for Phase4 authentication.

## Login (Phase4)

1. Set `ADMIN_PASSWORD` in your `.env.local`.
2. Visit `http://localhost:3000/login`.
3. Enter the password to obtain a session cookie.

> Note: `/login` is the only unauthenticated page. All other routes require login.

CLI login example (stores cookies to `cookie.txt`):

```bash
curl -i -c cookie.txt -X POST "http://localhost:3000/login" \
  -d "password=<ADMIN_PASSWORD>"
```

## Admin API (Phase4)

All `/api/*` endpoints require admin login **except** `/api/cron/*` (still uses `CRON_SECRET`).

### Create an account

```bash
curl -X POST "http://localhost:3000/api/admin/accounts" \
  -H "Content-Type: application/json" \
  -b "cookie.txt" \
  -d '{
    "username": "demo_account",
    "display_name": "Demo Account",
    "account_type": "manual"
  }'
```

### Create a tweet

```bash
curl -X POST "http://localhost:3000/api/admin/tweets" \
  -H "Content-Type: application/json" \
  -b "cookie.txt" \
  -d '{
    "account_id": "<ACCOUNT_ID>",
    "content": "Hello from Phase4!",
    "tweet_type": "manual",
    "scheduled_at": "2025-01-01T09:00:00.000Z"
  }'
```

### Create a posting job

```bash
curl -X POST "http://localhost:3000/api/admin/posting-jobs" \
  -H "Content-Type: application/json" \
  -b "cookie.txt" \
  -d '{
    "tweet_id": "<TWEET_ID>",
    "account_id": "<ACCOUNT_ID>",
    "run_at": "2025-01-01T09:05:00.000Z"
  }'
```

## Cron API (Phase3)

Create cron-job.org jobs that call the Cron API endpoints with the shared secret.

### Run posting jobs (every 10 minutes)

- **URL**: `https://<your-domain>/api/cron/run-posting`
- **Schedule**: `*/10 * * * *`
- **HTTP Method**: `POST`
- **Request Header**:
  - `Authorization: Bearer <CRON_SECRET>`

### Fetch analytics (once per day)

- **URL**: `https://<your-domain>/api/cron/fetch-analytics`
- **Schedule**: `0 3 * * *` (example)
- **HTTP Method**: `POST`
- **Request Header**:
  - `Authorization: Bearer <CRON_SECRET>`

## Cron verification (Phase4)

1. Log in via `/login` and create an account, tweet, and posting job with the admin APIs.
2. Trigger the cron endpoint:

```bash
curl -X POST "http://localhost:3000/api/cron/run-posting" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

3. Confirm the response shows the job processed successfully.
