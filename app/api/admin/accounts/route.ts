import { NextRequest, NextResponse } from 'next/server';

import { supabaseClient } from '@/lib/supabaseClient';

type AccountPayload = {
  x_user_id?: string;
  username?: string;
  display_name?: string;
  account_type?: string;
  status?: string;
};

export async function POST(request: NextRequest) {
  let payload: AccountPayload | null = null;

  try {
    payload = (await request.json()) as AccountPayload;
  } catch {
    payload = null;
  }

  if (!payload || !payload.username) {
    return NextResponse.json({ error: 'username is required.' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseClient
    .from('accounts')
    .insert({
      x_user_id: payload.x_user_id ?? null,
      username: payload.username,
      display_name: payload.display_name ?? null,
      account_type: payload.account_type ?? null,
      status: payload.status ?? 'active',
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id,username,display_name,account_type,status,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create account', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data }, { status: 201 });
}
