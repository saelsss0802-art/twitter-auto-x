import type { PostgrestError } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/lib/db/client';
import { insertPostingJob } from '@/lib/db/repositories/postingJobs';

const isNotFoundError = (error: PostgrestError | null) => error?.code === 'PGRST116';

type PostingJobPayload = {
  tweetId: string;
  runAt: string;
};

const parseRunAt = (runAt: string) => {
  const parsed = new Date(runAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

export async function POST(request: NextRequest) {
  let payload: PostingJobPayload | null = null;

  try {
    payload = (await request.json()) as PostingJobPayload;
  } catch {
    payload = null;
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { tweetId, runAt } = payload;

  if (!tweetId || typeof tweetId !== 'string') {
    return NextResponse.json({ error: 'tweetId is required.' }, { status: 400 });
  }

  if (!runAt || typeof runAt !== 'string') {
    return NextResponse.json({ error: 'runAt is required.' }, { status: 400 });
  }

  const runAtIso = parseRunAt(runAt);
  if (!runAtIso) {
    return NextResponse.json({ error: 'runAt must be a valid datetime string.' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: tweet, error: tweetError } = await supabase
    .from('tweets')
    .select('id,account_id')
    .eq('id', tweetId)
    .single();

  if (tweetError && !isNotFoundError(tweetError)) {
    return NextResponse.json({ error: 'Failed to load tweet.', detail: tweetError.message }, { status: 500 });
  }

  if (!tweet) {
    return NextResponse.json({ error: 'Tweet not found.' }, { status: 404 });
  }

  const { data: job, error: jobError } = await insertPostingJob({
    tweet_id: tweet.id,
    account_id: tweet.account_id,
    run_at: runAtIso,
    status: 'pending',
  });

  if (jobError) {
    return NextResponse.json({ error: 'Failed to create posting job.', detail: jobError.message }, { status: 500 });
  }

  return NextResponse.json({ jobId: job.id, status: job.status });
}
