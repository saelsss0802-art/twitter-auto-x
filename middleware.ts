import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, getAdminSecret, isValidSession } from '@/lib/auth';

const isStaticAsset = (pathname: string) =>
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon') ||
  pathname.startsWith('/robots.txt') ||
  pathname.startsWith('/sitemap.xml') ||
  pathname.match(/\.[a-zA-Z0-9]+$/) !== null;

const isLoginPath = (pathname: string) => pathname === '/login';

const isApiLoginPath = (pathname: string) => pathname === '/api/login';

const isCronApi = (pathname: string) => pathname.startsWith('/api/cron');

const isApiRoute = (pathname: string) => pathname.startsWith('/api/');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isStaticAsset(pathname) ||
    isLoginPath(pathname) ||
    isApiLoginPath(pathname) ||
    isCronApi(pathname)
  ) {
    return NextResponse.next();
  }

  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Admin password is not configured.' }, { status: 503 });
  }

  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = await isValidSession(sessionToken, secret);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (isApiRoute(pathname)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
