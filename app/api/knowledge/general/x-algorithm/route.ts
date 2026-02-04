import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, getAdminSecret, isValidSession } from '@/lib/auth';
import { readKnowledgeMarkdown } from '@/lib/knowledge';

const isAuthorized = async (request: NextRequest) => {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }
  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidSession(sessionToken, secret);
};

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const markdown = await readKnowledgeMarkdown('general/x-algorithm.md');
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
