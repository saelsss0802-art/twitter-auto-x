import { NextRequest, NextResponse } from 'next/server';

import { supabaseClient } from '@/lib/supabaseClient';

type PostResult = {
  ok: boolean;
  status: number;
  id?: string;
  error?: string;
};

const getCronSecret = () => process.env.CRON_SECRET ?? '';

const isAuthorized = (request: NextRequest) => {
  const secret = getCronSecret();
  if (!secret) {
    return false;
  }
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${secret}`;
};

const getCronConfig = () => {
  const maxJobs = Number(process.env.CRON_MAX_JOBS_PER_RUN ?? 10);
  const maxRetries = Number(process.env.CRON_MAX_RETRIES ?? 3);
  const lockTtlSec = Number(process.env.CRON_LOCK_TTL_SEC ?? 600);
  return { maxJobs, maxRetries, lockTtlSec };
};

const stubPostToX = async (): Promise<PostResult> => ({
  ok: true,
  status: 201,
  id: `stub-${crypto.randomUUID()}`,
});

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { maxJobs, maxRetries, lockTtlSec } = getCronConfig();
  const now = new Date();
  const nowIso = now.toISOString();
  const staleBefore = new Date(now.getTime() - lockTtlSec * 1000);
  const staleBeforeIso = staleBefore.toISOString();

  const { data: jobs, error } = await supabaseClient
    .from('posting_jobs')
    .select('id,tweet_id,account_id,run_at,status,attempts,locked_at')
    .eq('status', 'pending')
    .lte('run_at', nowIso)
    .or(`locked_at.is.null,locked_at.lt.${staleBeforeIso}`)
    .order('run_at', { ascending: true })
    .limit(maxJobs);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load posting jobs', detail: error.message },
      { status: 500 },
    );
  }

  const results: Array<{ jobId: string; status: string; detail?: string }> = [];
  let processedCount = 0;

  for (const job of jobs ?? []) {
    const { data: lockedJob } = await supabaseClient
      .from('posting_jobs')
      .update({ status: 'running', locked_at: nowIso, updated_at: nowIso })
      .eq('id', job.id)
      .eq('status', 'pending')
      .or(`locked_at.is.null,locked_at.lt.${staleBeforeIso}`)
      .select('id,tweet_id,account_id,attempts')
      .single();

    if (!lockedJob) {
      continue;
    }

    processedCount += 1;

    const { data: tweet, error: tweetError } = await supabaseClient
      .from('tweets')
      .select('id,content')
      .eq('id', lockedJob.tweet_id)
      .single();

    if (tweetError || !tweet) {
      await supabaseClient
        .from('posting_jobs')
        .update({
          status: 'failed',
          last_error: tweetError?.message ?? 'Tweet not found',
          locked_at: null,
          updated_at: nowIso,
        })
        .eq('id', lockedJob.id);
      results.push({
        jobId: lockedJob.id,
        status: 'failed',
        detail: tweetError?.message ?? 'Tweet not found',
      });
      continue;
    }

    const postResult = await stubPostToX();

    if (postResult.ok) {
      await supabaseClient
        .from('tweets')
        .update({
          status: 'posted',
          posted_at: nowIso,
          x_tweet_id: postResult.id ?? null,
          updated_at: nowIso,
        })
        .eq('id', lockedJob.tweet_id);

      await supabaseClient
        .from('posting_jobs')
        .update({ status: 'success', locked_at: null, updated_at: nowIso })
        .eq('id', lockedJob.id);

      results.push({ jobId: lockedJob.id, status: 'success' });
      continue;
    }

    const attempts = (lockedJob.attempts ?? 0) + 1;
    const shouldRetry = isRetryableStatus(postResult.status) && attempts <= maxRetries;
    const nextStatus = shouldRetry ? 'pending' : 'failed';

    await supabaseClient
      .from('posting_jobs')
      .update({
        status: nextStatus,
        attempts,
        last_error: postResult.error ?? `Post failed (${postResult.status})`,
        locked_at: null,
        run_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', lockedJob.id);

    results.push({
      jobId: lockedJob.id,
      status: nextStatus,
      detail: postResult.error ?? `Post failed (${postResult.status})`,
    });
  }

  return NextResponse.json({
    processed: processedCount,
    results,
  });
}
