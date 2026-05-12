
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

/**
 * SMART REDIRECT: Membangun link sosial media otomatis berdasarkan platform dan handle.
 */
export function getSmartSocialUrl(platform: string, handle: string): string {
  const cleanHandle = handle.trim();
  if (!cleanHandle) return '#';

  switch (platform) {
    case 'Instagram':
      return `https://instagram.com/${cleanHandle.replace('@', '')}`;
    case 'YouTube':
      return `https://youtube.com/${cleanHandle.startsWith('@') ? cleanHandle : '@' + cleanHandle}`;
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

/**
 * VIBRANT COLOR EXTRACTION: Sekarang mengekstrak warna asli dengan akurasi tinggi.
 */
export async function extractPaletteFromImage(base64: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(['#FFD700', '#FFFFFF']);

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);
      const data = ctx.getImageData(0, 0, 100, 100).data;

      const colors: Record<string, { count: number, score: number }> = {};
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 200) continue; // Hanya warna solid

        // Quantization ringan agar tidak "brutal"
        const qr = Math.round(r / 8) * 8;
        const qg = Math.round(g / 8) * 8;
        const qb = Math.round(b / 8) * 8;
        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

        const hsl = hexToHsl(hex);
        
        // Scoring: Prioritaskan Vibrancy dan Kecerahan
        const score = (hsl.s * 5) + (hsl.l > 20 && hsl.l < 90 ? 20 : 0); 

        if (!colors[hex]) {
          colors[hex] = { count: 1, score: score };
        } else {
          colors[hex].count++;
        }
      }

      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => (b.count * b.score) - (a.count * a.score)) 
        .slice(0, 12) 
        .map(([color]) => color);

      // Jika palet kosong, berikan warna dasar foto daripada pelangi brutal
      if (sortedColors.length < 2) return resolve(['#FFFFFF', '#C0C0C0', '#FFD700']);
      resolve(sortedColors);
    };
    img.onerror = () => resolve(['#FFFFFF', '#FFD700']);
  });
}
