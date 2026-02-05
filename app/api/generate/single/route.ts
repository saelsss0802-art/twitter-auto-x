import { NextRequest, NextResponse } from 'next/server';

import { generateSingleCompletion, OpenRouterConfigError, OpenRouterRequestError } from '@/lib/ai/openrouter';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/generation/prompts';
import { validateGenerateSingleRequest } from '@/lib/generation/schema';
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

  const { typeId, theme, keywords, includeHashtags } = validation.value;
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
    const { content } = enforceTweetLimit(result.content);

    if (content.length === 0) {
      return NextResponse.json({ error: 'Generated content is empty.' }, { status: 502 });
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
