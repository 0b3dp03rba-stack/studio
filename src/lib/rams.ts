/**
 * @fileOverview Helper for Rams API communication.
 * Encapsulates the API Key and Base URL logic on the server side.
 */

const BASE_URL = process.env.RAMS_BASE_URL;
const API_KEY = process.env.RAMS_API_KEY;

export async function ramsFetch(endpoint: string, options: RequestInit = {}) {
  if (!BASE_URL || !API_KEY) {
    throw new Error('RAMS_BASE_URL or RAMS_API_KEY is not defined in environment variables.');
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
