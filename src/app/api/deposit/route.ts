import { NextResponse } from 'next/server';
import { ramsFetch } from '@/lib/rams';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimal deposit adalah 100 IDR' }, { status: 400 });
    }

    const data = await ramsFetch('/deposit/create', {
      method: 'POST',
      body: JSON.stringify({ amount, method: 'qris' })
    });

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Create Deposit Error:', e);
    return NextResponse.json({ error: e.message || 'Gagal membuat deposit' }, { status: 500 });
  }
}
