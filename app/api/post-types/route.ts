import { NextResponse } from 'next/server';

import { listPostTypes } from '@/lib/postTypes';

export async function GET() {
  const types = listPostTypes();
  return NextResponse.json({ types });
}
