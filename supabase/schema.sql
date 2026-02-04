create extension if not exists "pgcrypto";

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  x_user_id text unique,
  username text,
  display_name text,
  account_type text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text,
  tone text,
  age integer,
  hobbies text,
  interests text,
  forbidden_words text[],
  hashtag_templates text[],
  themes text[],
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id)
);

create table if not exists tweets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  content text not null,
  status text not null default 'draft',
  tweet_type text,
  scheduled_at timestamptz,
  posted_at timestamptz,
  x_tweet_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tweets_account_id_idx on tweets (account_id);
create index if not exists tweets_status_idx on tweets (status);
create index if not exists tweets_scheduled_at_idx on tweets (scheduled_at);
create index if not exists tweets_posted_at_idx on tweets (posted_at);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  storage_path text not null,
  media_type text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tweet_media (
  tweet_id uuid not null references tweets(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tweet_id, media_id)
);

create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  tweet_id uuid not null references tweets(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  snapshot_date date not null,
  impressions integer not null default 0,
  likes integer not null default 0,
  retweets integer not null default 0,
  replies integer not null default 0,
  quotes integer not null default 0,
  bookmarks integer not null default 0,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tweet_id, snapshot_date)
);

create table if not exists posting_jobs (
  id uuid primary key default gen_random_uuid(),
  tweet_id uuid not null references tweets(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  run_at timestamptz not null,
  status text not null,
  attempts integer not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posting_jobs_run_at_idx on posting_jobs (run_at);
create index if not exists posting_jobs_status_idx on posting_jobs (status);
create index if not exists posting_jobs_locked_at_idx on posting_jobs (locked_at);
create index if not exists posting_jobs_status_run_at_idx on posting_jobs (status, run_at);

create table if not exists account_safety_settings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  min_interval_sec integer not null default 0,
  daily_cap integer not null default 0,
  jitter_sec_max integer not null default 0,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id)
);

create table if not exists knowledge_files (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  category text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
