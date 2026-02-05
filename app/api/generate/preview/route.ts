import { NextRequest, NextResponse } from 'next/server';

import { validateGenerateSingleRequest } from '@/lib/generation/schema';
import { readKnowledgeMarkdown } from '@/lib/knowledge';
import { getPostTypeById } from '@/lib/postTypes';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/generation/prompts';

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

    return NextResponse.json({
      systemPrompt,
      userPrompt,
      knowledge: {
        typeMarkdown,
        algorithmMarkdown,
      },
      meta: {
        typeId,
        theme: theme ?? null,
        keywords: keywords ?? [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load knowledge.';
    const status = message.includes('Invalid knowledge path') ? 400 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
