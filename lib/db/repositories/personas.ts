import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@/lib/db/client';
import type { Persona } from '@/lib/db/types';

export const getPersonaByAccountId = async (
  accountId: string,
): Promise<PostgrestSingleResponse<Persona>> => {
  const supabase = getSupabaseServerClient();
  return supabase
    .from('personas')
    .select('id,account_id,name,forbidden_words')
    .eq('account_id', accountId)
    .single();
};
