import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, getAdminSecret, isValidSession } from '@/lib/auth';
import { listKnowledgeTypes } from '@/lib/knowledge';

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

  const types = await listKnowledgeTypes();
  return NextResponse.json({ types });
}
