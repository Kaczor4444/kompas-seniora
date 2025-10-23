import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
  
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    urlPrefix: dbUrl.substring(0, 20),
    urlLength: dbUrl.length,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES'))
  });
}
