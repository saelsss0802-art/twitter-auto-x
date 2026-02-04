import { NextRequest, NextResponse } from 'next/server';

import { supabaseClient } from '@/lib/supabaseClient';

type PostingJobPayload = {
  tweet_id?: string;
  account_id?: string;
  run_at?: string;
};

export async function POST(request: NextRequest) {
  let payload: PostingJobPayload | null = null;

  try {
    payload = (await request.json()) as PostingJobPayload;
  } catch {
    payload = null;
  }

  if (!payload || !payload.tweet_id || !payload.account_id || !payload.run_at) {
    return NextResponse.json(
      { error: 'tweet_id, account_id, and run_at are required.' },
      { status: 400 },
    );
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseClient
    .from('posting_jobs')
    .insert({
      tweet_id: payload.tweet_id,
      account_id: payload.account_id,
      run_at: payload.run_at,
      status: 'pending',
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id,tweet_id,account_id,run_at,status,created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create posting job', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ posting_job: data }, { status: 201 });
}
