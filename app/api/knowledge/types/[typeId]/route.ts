import { NextRequest, NextResponse } from 'next/server';
import { readKnowledgeMarkdown } from '@/lib/knowledge';

export async function GET(
  request: NextRequest,
  { params }: { params: { typeId: string } },
) {
  try {
    const markdown = await readKnowledgeMarkdown(`types/${params.typeId}.md`);
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Not found';
    const status = message.includes('Invalid knowledge path') ? 400 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
