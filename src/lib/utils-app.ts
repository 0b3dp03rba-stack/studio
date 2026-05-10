
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
      // Menghapus karakter non-digit untuk wa.me
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
 * 20 Warna Sekunder "Prestige" Terkurasi (Elegan & Vibrant)
 */
export const PRESTIGE_SECONDARIES = [
  '#FFFFFF', // White Crystal
  '#FFD700', // Royal Gold
  '#00FFFF', // Electric Cyan
  '#FFFF00', // Neon Yellow
  '#FF00FF', // Vivid Magenta
  '#00FF00', // Lime Neon
  '#FF0000', // True Red
  '#7B00FF', // Deep Majesty Purple
  '#E0FFFF', // Cloud Blue
  '#FF69B4', // Hot Pink
  '#F0E68C', // Khaki/Silk
  '#7DF9FF', // Diamond Blue
  '#B76E79', // Rose Gold
  '#C0C0C0', // Silver Metallic
  '#FF4500', // Orange Red
  '#00FF7F', // Spring Green
  '#87CEEB', // Sky Blue
  '#D8BFD8', // Thistle Purple
  '#FFE4E1', // Misty Rose
  '#F5F5DC', // Beige Luxury
];

/**
 * Konversi Hex ke HSL untuk analisa vibrance
 */
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

/**
 * SMART COLOR AI: Memberikan saran warna sekunder paling estetis berdasarkan warna primer.
 */
export function getRecommendedSecondary(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex);
  
  // Logic AI Design:
  // 1. Jika Primer Gelap (Maroon, Navy, Brown, Black) -> Gunakan Emas atau Putih
  if (hsl.l < 45) {
    if (hsl.h <= 30 || hsl.h >= 330) return '#FFD700'; // Dark Red/Maroon -> Gold
    return '#FFFFFF'; // Dark others -> White
  }

  // 2. Jika Primer Merah Terang -> Gunakan Putih atau Emas
  if ((hsl.h <= 10 || hsl.h >= 345) && hsl.s > 50) return '#FFFFFF';

  // 3. Jika Primer Biru/Hijau -> Gunakan Kuning atau Putih
  if (hsl.h > 150 && hsl.h < 280) return '#FFFF00'; 

  // 4. Jika Primer Ungu -> Gunakan Lime atau Putih
  if (hsl.h >= 280 && hsl.h < 330) return '#00FF00';

  // 5. Default Prestige
  return '#FFFFFF';
}

/**
 * Mengekstrak 20 palet warna dari gambar base64.
 */
export async function extractPaletteFromImage(base64: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const standardBackup = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#FFD700', '#00FFFF', '#FFA500', '#FFFF00'];
      
      if (!ctx) return resolve(standardBackup);

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);
      const data = ctx.getImageData(0, 0, 100, 100).data;

      const colors: Record<string, { count: number, score: number, hsl: any }> = {};
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 180) continue;

        const factor = 15; 
        const qr = Math.round(r / factor) * factor;
        const qg = Math.round(g / factor) * factor;
        const qb = Math.round(b / factor) * factor;
        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

        const hsl = hexToHsl(hex);
        if (hsl.l < 5 || hsl.l > 98) continue;

        // Vibrancy Score
        const score = (hsl.s * 3) + (hsl.l * 2); 

        if (!colors[hex]) {
          colors[hex] = { count: 1, score: score, hsl: hsl };
        } else {
          colors[hex].count++;
        }
      }

      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => b.score - a.score) 
        .slice(0, 20) 
        .map(([color]) => color);

      if (sortedColors.length < 5) return resolve(standardBackup);
      resolve(sortedColors);
    };
    img.onerror = () => resolve(['#FF0000', '#FFD700', '#00FFFF', '#FFFFFF']);
  });
}
