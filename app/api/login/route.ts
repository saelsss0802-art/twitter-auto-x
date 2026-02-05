import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, buildSessionToken, getAdminSecret, isValidPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Admin password is not configured.' }, { status: 503 });
  }

  const formData = await request.formData();
  const password = String(formData.get('password') ?? '');
  const nextPath = String(formData.get('next') ?? '/');

  if (!isValidPassword(password, secret)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', '1');
    redirectUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(redirectUrl);
  }

  const sessionToken = await buildSessionToken(secret);
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}
