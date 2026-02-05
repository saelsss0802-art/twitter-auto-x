import type { PostgrestError } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { getAccountById } from '@/lib/db/repositories/accounts';
import { getPersonaByAccountId } from '@/lib/db/repositories/personas';
import { insertPostingJob } from '@/lib/db/repositories/postingJobs';
import { insertTweet } from '@/lib/db/repositories/tweets';
import { applyAccountTypeRules } from '@/lib/generation/rules';
import { validateTweetContent } from '@/lib/generation/validation';

const TWEET_CHAR_LIMIT = 280;

type GenerateAndSavePayload = {
  accountId: string;
  typeId: string;
  content?: string;
  scheduledAt?: string;
};

const isNotFoundError = (error: PostgrestError | null) => error?.code === 'PGRST116';

const parseScheduledAt = (scheduledAt?: string) => {
  if (!scheduledAt) {
    return null;
  }
  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const buildStubContent = (typeId: string) => `[${typeId}] Auto-generated draft.`;

export async function POST(request: NextRequest) {
  let payload: GenerateAndSavePayload | null = null;

  try {
    payload = (await request.json()) as GenerateAndSavePayload;
  } catch {
    payload = null;
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { accountId, typeId, content, scheduledAt } = payload;

  if (!accountId || typeof accountId !== 'string') {
    return NextResponse.json({ error: 'accountId is required.' }, { status: 400 });
  }

  if (!typeId || typeof typeId !== 'string') {
    return NextResponse.json({ error: 'typeId is required.' }, { status: 400 });
  }

  if (content !== undefined && typeof content !== 'string') {
    return NextResponse.json({ error: 'content must be a string.' }, { status: 400 });
  }

  const scheduledAtIso = parseScheduledAt(scheduledAt);
  if (scheduledAt && !scheduledAtIso) {
    return NextResponse.json({ error: 'scheduledAt must be a valid datetime string.' }, { status: 400 });
  }

  const { data: account, error: accountError } = await getAccountById(accountId);
  if (accountError && !isNotFoundError(accountError)) {
    return NextResponse.json(
      { error: 'Failed to load account.', detail: accountError.message },
      { status: 500 },
    );
  }
  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const { data: persona, error: personaError } = await getPersonaByAccountId(accountId);
  if (personaError && !isNotFoundError(personaError)) {
    return NextResponse.json(
      { error: 'Failed to load persona.', detail: personaError.message },
      { status: 500 },
    );
  }
  if (!persona) {
    return NextResponse.json({ error: 'Persona not found.' }, { status: 404 });
  }

  const baseContent = content?.trim().length ? content.trim() : buildStubContent(typeId);
  const rulesResult = applyAccountTypeRules({
    accountType: account.account_type ?? undefined,
    persona: { forbidden_words: persona.forbidden_words ?? undefined },
    draft: { content: baseContent },
  });

  const finalizedContent = rulesResult.draft.content.trim();
  if (!finalizedContent) {
    return NextResponse.json({ error: 'Content is empty after rules.' }, { status: 422 });
  }

  const validationResult = validateTweetContent(finalizedContent, {
    maxLength: TWEET_CHAR_LIMIT,
    forbiddenWords: persona.forbidden_words ?? undefined,
  });

  if (!validationResult.ok) {
    return NextResponse.json({ error: 'Validation failed.', reasons: validationResult.reasons }, { status: 422 });
  }

  const status = scheduledAtIso ? 'scheduled' : 'draft';
  const { data: tweet, error: tweetError } = await insertTweet({
    account_id: accountId,
    content: finalizedContent,
    status,
    tweet_type: typeId,
    scheduled_at: scheduledAtIso,
  });

  if (tweetError) {
    return NextResponse.json({ error: 'Failed to save tweet.', detail: tweetError.message }, { status: 500 });
  }

  let jobId: string | undefined;
  if (scheduledAtIso) {
    const { data: job, error: jobError } = await insertPostingJob({
      tweet_id: tweet.id,
      account_id: accountId,
      run_at: scheduledAtIso,
      status: 'pending',
    });

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create posting job.', detail: jobError.message },
        { status: 500 },
      );
    }

    jobId = job.id;
  }

  return NextResponse.json({
    tweetId: tweet.id,
    jobId,
    status: tweet.status,
    content: tweet.content,
  });
}
