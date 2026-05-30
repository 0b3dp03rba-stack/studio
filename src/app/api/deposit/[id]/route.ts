
import { NextResponse } from 'next/server';
import { ramsConfig } from '@/firebase/config';

/**
 * @fileOverview Server-side robust verification for Rams API.
 * Menghindari caching browser dan menangani berbagai format respon status.
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: depositId } = await params;
    
    if (!depositId) {
      return NextResponse.json({ error: 'Deposit ID diperlukan' }, { status: 400 });
    }

    const res = await fetch(`https://ramashop.my.id/api/public/deposit/status/${depositId}`, {
      headers: {
        'X-API-Key': ramsConfig.apiKey,
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // FORCE NO CACHE
    });

    if (!res.ok) {
      throw new Error(`Rams API Error: ${res.status}`);
    }

    const data = await res.json();
    
    // Rams Response Mapping
    // Possible statuses: pending, success, already, expired
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Verify Payment API Error:', e);
    return NextResponse.json({ error: e.message || 'Gagal sinkronisasi API' }, { status: 500 });
  }
}
