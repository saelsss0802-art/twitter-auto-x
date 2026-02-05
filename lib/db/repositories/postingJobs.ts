import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@/lib/db/client';
import type { PostingJob, PostingJobInsert } from '@/lib/db/types';

export const insertPostingJob = async (
  payload: PostingJobInsert,
): Promise<PostgrestSingleResponse<PostingJob>> => {
  const supabase = getSupabaseServerClient();
  return supabase
    .from('posting_jobs')
    .insert(payload)
    .select('id,tweet_id,account_id,run_at,status')
    .single();
};
