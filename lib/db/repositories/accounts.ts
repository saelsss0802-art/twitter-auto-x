import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@/lib/db/client';
import type { Account } from '@/lib/db/types';

export const getAccountById = async (accountId: string): Promise<PostgrestSingleResponse<Account>> => {
  const supabase = getSupabaseServerClient();
  return supabase.from('accounts').select('id,account_type,status').eq('id', accountId).single();
};
