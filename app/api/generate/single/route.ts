import { NextRequest, NextResponse } from 'next/server';

import { generateSingleCompletion, OpenRouterConfigError, OpenRouterRequestError } from '@/lib/ai/openrouter';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/generation/prompts';
import { applyAccountTypeRules } from '@/lib/generation/rules';
import { validateGenerateSingleRequest } from '@/lib/generation/schema';
import { validateTweetContent } from '@/lib/generation/validation';
import { readKnowledgeMarkdown } from '@/lib/knowledge';
import { getPostTypeById } from '@/lib/postTypes';

const TWEET_CHAR_LIMIT = 280;

const enforceTweetLimit = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.length <= TWEET_CHAR_LIMIT) {
    return { content: trimmed, truncated: false };
  }

  const shortened = `${trimmed.slice(0, TWEET_CHAR_LIMIT - 3).trimEnd()}...`;
  return { content: shortened, truncated: true };
};

const rewriteToFitRules = (
  content: string,
  options: {
    maxLength: number;
    forbiddenWords?: string[];
    maxLinks?: number;
    maxHashtags?: number;
    maxNewlines?: number;
  },
) => {
  let rewritten = content;
  const forbiddenWords = options.forbiddenWords?.filter((word) => word.trim().length > 0) ?? [];
  for (const word of forbiddenWords) {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi');
    rewritten = rewritten.replace(pattern, '').replace(/\s{2,}/g, ' ');
  }

  if (options.maxLinks !== undefined) {
    let linkCount = 0;
    rewritten = rewritten.replace(/https?:\/\/\S+/gi, (match) => {
      linkCount += 1;
      return linkCount > options.maxLinks ? '' : match;
    });
  }

  if (options.maxHashtags !== undefined) {
    let hashtagCount = 0;
    rewritten = rewritten.replace(/#\w+/g, (match) => {
      hashtagCount += 1;
      return hashtagCount > options.maxHashtags ? '' : match;
    });
  }

  if (options.maxNewlines !== undefined) {
    const lines = rewritten.split('\n');
    rewritten = lines.slice(0, options.maxNewlines + 1).join('\n');
  }

  rewritten = rewritten.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
  return enforceTweetLimit(rewritten).content;
};

export async function POST(request: NextRequest) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const validation = validateGenerateSingleRequest(payload);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { typeId, theme, keywords, includeHashtags, accountType, persona, validation: validationOptions } =
    validation.value;
  const postType = getPostTypeById(typeId);
  if (!postType) {
    return NextResponse.json({ error: 'Unknown typeId.' }, { status: 400 });
  }

  try {
    const [typeMarkdown, algorithmMarkdown] = await Promise.all([
      readKnowledgeMarkdown(`types/${typeId}.md`),
      readKnowledgeMarkdown('general/x-algorithm.md'),
    ]);

    const systemPrompt = buildSystemPrompt(
      postType.name,
      postType.purpose,
      postType.structureHint,
      postType.tips,
      algorithmMarkdown,
    );
    const userPrompt = buildUserPrompt(theme, keywords, includeHashtags ?? false, typeMarkdown);

    const result = await generateSingleCompletion({ systemPrompt, userPrompt });
    const rulesResult = applyAccountTypeRules({
      accountType,
      persona,
      draft: { content: result.content.trim() },
    });
    let content = rulesResult.draft.content.trim();

    if (content.length === 0) {
      return NextResponse.json({ error: 'Generated content is empty.' }, { status: 502 });
    }

    const validationResult = validateTweetContent(content, {
      maxLength: TWEET_CHAR_LIMIT,
      forbiddenWords: persona?.forbidden_words,
      maxLinks: validationOptions?.maxLinks,
      maxHashtags: validationOptions?.maxHashtags,
      maxNewlines: validationOptions?.maxNewlines,
    });

    if (!validationResult.ok) {
      const rewritten = rewriteToFitRules(content, {
        maxLength: TWEET_CHAR_LIMIT,
        forbiddenWords: persona?.forbidden_words,
        maxLinks: validationOptions?.maxLinks,
        maxHashtags: validationOptions?.maxHashtags,
        maxNewlines: validationOptions?.maxNewlines,
      });

      const retryResult = validateTweetContent(rewritten, {
        maxLength: TWEET_CHAR_LIMIT,
        forbiddenWords: persona?.forbidden_words,
        maxLinks: validationOptions?.maxLinks,
        maxHashtags: validationOptions?.maxHashtags,
        maxNewlines: validationOptions?.maxNewlines,
      });

      if (!retryResult.ok) {
        return NextResponse.json({ error: 'Validation failed.', reasons: retryResult.reasons }, { status: 422 });
      }

      content = rewritten;
    }

    return NextResponse.json({
      content,
      typeId,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    });
  } catch (error) {
    if (error instanceof OpenRouterConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof OpenRouterRequestError) {
      const status = error.status === 429 ? 503 : error.status >= 500 ? 502 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }

    const message = error instanceof Error ? error.message : 'Failed to generate.';
    const status = message.includes('Invalid knowledge path') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
