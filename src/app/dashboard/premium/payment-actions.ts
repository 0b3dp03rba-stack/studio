
'use server';

/**
 * @fileOverview Server Actions untuk menangani komunikasi aman dengan Rams API.
 * Menghindari kebocoran X-API-Key di sisi klien.
 */

const API_KEY = process.env.RAMS_API_KEY;
const BASE_URL = process.env.RAMS_BASE_URL;

export async function createRamsDeposit(amount: number) {
  if (!API_KEY || !BASE_URL) {
    throw new Error('Konfigurasi RAMS API tidak ditemukan di .env');
  }

  try {
    const response = await fetch(`${BASE_URL}/deposit/create`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, method: 'qris' }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Rams Create Error:', error);
    return { success: false, message: 'Gagal menghubungi server pembayaran' };
  }
}

export async function checkRamsStatus(depositId: string) {
  if (!API_KEY || !BASE_URL) {
    throw new Error('Konfigurasi RAMS API tidak ditemukan di .env');
  }

  try {
    const response = await fetch(`${BASE_URL}/deposit/status/${depositId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
      },
      cache: 'no-store', // Hindari cache agar status selalu terbaru
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Rams Status Error:', error);
    return { status: false, message: 'Gagal mengecek status' };
  }
}
