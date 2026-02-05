import { NextResponse } from 'next/server';
import { listKnowledgeTypes } from '@/lib/knowledge';

export async function GET() {
  const types = await listKnowledgeTypes();
  return NextResponse.json({ types });
}
