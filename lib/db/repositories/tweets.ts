import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@/lib/db/client';
import type { Tweet, TweetInsert } from '@/lib/db/types';

export const insertTweet = async (payload: TweetInsert): Promise<PostgrestSingleResponse<Tweet>> => {
  const supabase = getSupabaseServerClient();
  return supabase
    .from('tweets')
    .insert(payload)
    .select('id,account_id,content,status,tweet_type,scheduled_at')
    .single();
};

export const updateTweetStatus = async (
  tweetId: string,
  status: string,
): Promise<PostgrestSingleResponse<Tweet>> => {
  const supabase = getSupabaseServerClient();
  const nowIso = new Date().toISOString();
  return supabase
    .from('tweets')
    .update({ status, updated_at: nowIso })
    .eq('id', tweetId)
    .select('id,account_id,content,status,tweet_type,scheduled_at')
    .single();
};
