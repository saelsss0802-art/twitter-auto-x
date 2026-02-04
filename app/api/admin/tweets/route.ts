import { NextRequest, NextResponse } from 'next/server';

import { supabaseClient } from '@/lib/supabaseClient';

type TweetPayload = {
  account_id?: string;
  content?: string;
  tweet_type?: string;
  scheduled_at?: string;
};

export async function POST(request: NextRequest) {
  let payload: TweetPayload | null = null;

  try {
    payload = (await request.json()) as TweetPayload;
  } catch {
    payload = null;
  }

  if (!payload || !payload.account_id || !payload.content) {
    return NextResponse.json({ error: 'account_id and content are required.' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const status = payload.scheduled_at ? 'scheduled' : 'draft';

  const { data, error } = await supabaseClient
    .from('tweets')
    .insert({
      account_id: payload.account_id,
      content: payload.content,
      tweet_type: payload.tweet_type ?? null,
      scheduled_at: payload.scheduled_at ?? null,
      status,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id,account_id,content,tweet_type,scheduled_at,status,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create tweet', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ tweet: data }, { status: 201 });
}
