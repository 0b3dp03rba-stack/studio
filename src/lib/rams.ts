/**
 * @fileOverview Helper for Rams API communication.
 * Mengambil konfigurasi langsung dari config.ts sesuai permintaan user.
 */

import { ramsConfig } from '@/firebase/config';

const BASE_URL = ramsConfig.baseUrl;
const API_KEY = ramsConfig.apiKey;

export async function ramsFetch(endpoint: string, options: RequestInit = {}) {
  if (!BASE_URL || !API_KEY) {
    throw new Error('Rams configuration (apiKey/baseUrl) is missing in src/firebase/config.ts');
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Rams API Error: ${res.status}`);
  }

  return res.json();
}
