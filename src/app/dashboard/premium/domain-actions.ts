
'use server';

/**
 * @fileOverview Server Actions untuk otomatisasi Vercel Domain API.
 * Menangani pendaftaran dan penghapusan domain kustom di infrastruktur Vercel.
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID; // Opsional jika menggunakan Vercel Team

async function vercelFetch(endpoint: string, method: string = 'GET', body?: any) {
  if (!VERCEL_TOKEN || !PROJECT_ID) {
    throw new Error('Konfigurasi VERCEL_TOKEN atau VERCEL_PROJECT_ID belum diatur di server.');
  }

  const url = new URL(`https://api.vercel.com${endpoint}`);
  if (TEAM_ID) url.searchParams.append('teamId', TEAM_ID);

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

/**
 * Mendaftarkan domain kustom ke proyek Vercel secara otomatis.
 */
export async function addDomainToVercel(domain: string) {
  try {
    const data = await vercelFetch(`/v9/projects/${PROJECT_ID}/domains`, 'POST', { name: domain });
    if (data.error) {
      // Jika domain sudah ada, anggap sukses atau handle spesifik
      if (data.error.code === 'domain_already_exists') return { success: true, message: 'Domain sudah terdaftar.' };
      return { success: false, error: data.error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Menghapus domain kustom dari proyek Vercel.
 */
export async function removeDomainFromVercel(domain: string) {
  try {
    const data = await vercelFetch(`/v9/projects/${PROJECT_ID}/domains/${domain}`, 'DELETE');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
