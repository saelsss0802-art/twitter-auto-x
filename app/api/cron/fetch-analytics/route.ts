import { NextRequest, NextResponse } from 'next/server';

import { supabaseClient } from '@/lib/supabaseClient';

type AnalyticsMetrics = {
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
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

const stubFetchMetrics = async (): Promise<AnalyticsMetrics> => ({
  impressions: 0,
  likes: 0,
  retweets: 0,
  replies: 0,
  quotes: 0,
  bookmarks: 0,
});

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const snapshotDate = nowIso.slice(0, 10);
  const windowStart = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const { data: tweets, error } = await supabaseClient
    .from('tweets')
    .select('id,account_id,posted_at')
    .not('posted_at', 'is', null)
    .gte('posted_at', windowStart.toISOString())
    .lte('posted_at', windowEnd.toISOString());

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load tweets', detail: error.message },
      { status: 500 },
    );
  }

  let processed = 0;
  const results: Array<{ tweetId: string; status: string }> = [];

  for (const tweet of tweets ?? []) {
    const metrics = await stubFetchMetrics();

    const { error: upsertError } = await supabaseClient.from('analytics').upsert(
      {
        tweet_id: tweet.id,
        account_id: tweet.account_id,
        snapshot_date: snapshotDate,
        fetched_at: nowIso,
        updated_at: nowIso,
        ...metrics,
      },
      { onConflict: 'tweet_id,snapshot_date' },
    );

    if (upsertError) {
      results.push({ tweetId: tweet.id, status: 'failed' });
      continue;
    }

    processed += 1;
    results.push({ tweetId: tweet.id, status: 'success' });
  }

  return NextResponse.json({
    processed,
    window: {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
    },
    results,
  });
}
