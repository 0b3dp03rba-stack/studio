
import { NextResponse } from 'next/server';
import { ramsFetch } from '@/lib/rams';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await ramsFetch(`/deposit/status/${id}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Gagal cek status' }, { status: 500 });
  }
}
