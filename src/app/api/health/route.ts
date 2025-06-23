import { NextResponse } from 'next/server';

// Semplice endpoint per verificare se l'applicazione è attiva
// Utilizzato dal healthcheck di Docker
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
} 