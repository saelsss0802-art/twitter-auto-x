import { timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE_NAME = 'admin_session';

export const getAdminSecret = () =>
  process.env.ADMIN_PASSWORD ?? process.env.ADMIN_TOKEN ?? '';

const hashSecret = async (secret: string) => {
  const data = new TextEncoder().encode(`admin-session:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const buildSessionToken = (secret: string) => hashSecret(secret);

export const isValidPassword = (input: string, secret: string) => {
  if (!input || !secret) {
    return false;
  }
  const inputBuffer = Buffer.from(input);
  const secretBuffer = Buffer.from(secret);
  if (inputBuffer.length !== secretBuffer.length) {
    return false;
  }
  return timingSafeEqual(inputBuffer, secretBuffer);
};

export const isValidSession = async (sessionToken: string | undefined, secret: string) => {
  if (!sessionToken || !secret) {
    return false;
  }
  const expected = await buildSessionToken(secret);
  return sessionToken === expected;
};
