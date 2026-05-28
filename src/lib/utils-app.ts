export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * SMART REDIRECT: Membangun link sosial media otomatis.
 */
export function getSmartSocialUrl(platform: string, handle: string): string {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return '#';

  switch (platform) {
    case 'Instagram':
      return `https://instagram.com/${cleanHandle.replace('@', '')}`;
    case 'YouTube':
      return `https://youtube.com/${cleanHandle.startsWith('@') ? handle : '@' + cleanHandle}`;
    case 'TikTok':
      return `https://tiktok.com/@${cleanHandle.replace('@', '')}`;
    case 'Facebook':
      return `https://facebook.com/${cleanHandle}`;
    case 'WhatsApp':
      return `https://wa.me/${cleanHandle.replace(/[^0-9]/g, '')}`;
    case 'Email':
      return `mailto:${cleanHandle}`;
    case 'Website':
      return cleanHandle.startsWith('http') ? cleanHandle : `https://${cleanHandle}`;
    default:
      return cleanHandle.startsWith('http') ? cleanHandle : `https://${cleanHandle}`;
  }
}

/**
 * Membangun URL publik pengguna secara ADAPTIF.
 * Memberikan link subdomain di produksi/localhost, dan path di workstation/vercel-preview.
 */
export function getPublicUrl(username: string): string {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const cleanUsername = username.toLowerCase();

  // 1. Lingkungan Subdomain (linku.biz.id atau localhost)
  if (
    hostname === 'linku.biz.id' || 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    hostname.endsWith('.linku.biz.id')
  ) {
    // Bersihkan hostname dari subdomain lama jika sedang diakses dari subdomain
    const baseDomain = hostname.includes('linku.biz.id') ? 'linku.biz.id' : 'localhost';
    return `${protocol}//${cleanUsername}.${baseDomain}${port}`;
  }

  // 2. Lingkungan Testing (Workstation / Vercel Preview)
  // Pakai format path /username agar tidak kena SSL Error
  return `${protocol}//${hostname}${port}/${cleanUsername}`;
}

export const PRESTIGE_SECONDARIES = [
  '#FFFFFF', '#FFD700', '#00FFFF', '#FFFF00', '#FF00FF', '#00FF00', '#FF0000', '#7B00FF', 
  '#E0FFFF', '#FF69B4', '#F0E68C', '#7DF9FF', '#B76E79', '#C0C0C0', '#FF4500', '#00FF7F'
];

function hexToHsl(hex: string) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getRecommendedSecondary(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex);
  if (hsl.l < 45) {
    if (hsl.h <= 30 || hsl.h >= 330) return '#FFD700';
    return '#FFFFFF';
  }
  if ((hsl.h <= 10 || hsl.h >= 345) && hsl.s > 50) return '#FFFFFF';
  if (hsl.h > 150 && hsl.h < 280) return '#FFFF00'; 
  if (hsl.h >= 280 && hsl.h < 330) return '#00FF00';
  return '#FFFFFF';
}

export async function extractPaletteFromImage(base64: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(['#FFFFFF', '#FFD700']);

      canvas.width = 150;
      canvas.height = 150;
      ctx.drawImage(img, 0, 0, 150, 150);
      const data = ctx.getImageData(0, 0, 150, 150).data;

      const hueBuckets: Record<number, { hex: string, saturation: number, luminance: number, score: number }[]> = {};
      for(let i=0; i<12; i++) hueBuckets[i] = [];

      for (let i = 0; i < data.length; i += 16) { 
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 250) continue; 

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        const hsl = hexToHsl(hex);
        
        if (hsl.l < 5 || hsl.l > 95) continue;

        const bucketIndex = Math.floor(hsl.h / 30) % 12;
        const score = (hsl.s * 3) + (hsl.l > 30 && hsl.l < 80 ? 30 : 0);

        hueBuckets[bucketIndex].push({ hex, saturation: hsl.s, luminance: hsl.l, score });
      }

      const palette: string[] = [];
      Object.values(hueBuckets).forEach(bucket => {
        if (bucket.length > 0) {
          const sorted = bucket.sort((a, b) => b.score - a.score);
          palette.push(sorted[0].hex);
        }
      });

      palette.push('#FFFFFF', '#F5F5F5');

      const finalPalette = [...new Set(palette)]
        .sort((a, b) => {
          const hslA = hexToHsl(a);
          const hslB = hexToHsl(b);
          return (hslB.s + (hslB.l/2)) - (hslA.s + (hslA.l/2));
        })
        .slice(0, 12);

      resolve(finalPalette.length > 0 ? finalPalette : ['#FFFFFF', '#FFD700']);
    };
    img.onerror = () => resolve(['#FFFFFF', '#FFD700']);
  });
}
