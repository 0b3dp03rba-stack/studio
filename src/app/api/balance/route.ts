import { NextResponse } from 'next/server';
import { ramsFetch } from '@/lib/rams';

export async function GET() {
  try {
    const data = await ramsFetch('/balance');
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Gagal ambil saldo' }, { status: 500 });
  }
}
