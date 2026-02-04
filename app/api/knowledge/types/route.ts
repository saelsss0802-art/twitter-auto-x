import { NextRequest, NextResponse } from 'next/server';

import { listKnowledgeTypes } from '@/lib/knowledge';

const getKnowledgeSecret = () => process.env.KNOWLEDGE_API_SECRET ?? '';

const isAuthorized = (request: NextRequest) => {
  const secret = getKnowledgeSecret();
  if (!secret) {
    return false;
  }
  const authHeader = request.headers.get('authorization') ?? '';
  return authHeader === `Bearer ${secret}`;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const types = await listKnowledgeTypes();
  return NextResponse.json({ types });
}
