
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
 * 20 Warna Sekunder "Prestige" Permanen untuk kesan mewah maksimal.
 */
export const PRESTIGE_SECONDARIES = [
  '#FFFFFF', // White Crystal
  '#FFD700', // Royal Gold
  '#00FFFF', // Electric Cyan
  '#FFFF00', // Neon Yellow
  '#FF00FF', // Vivid Magenta
  '#00FF00', // Lime Neon
  '#FF4500', // Orange Red
  '#E0FFFF', // Cloud Blue
  '#FF69B4', // Hot Pink
  '#F0E68C', // Khaki/Silk
  '#7DF9FF', // Diamond Blue
  '#B76E79', // Rose Gold
  '#F5F5DC', // Beige Luxury
  '#D8BFD8', // Thistle Purple
  '#AFEEEE', // Pale Turquoise
  '#FFFACD', // Lemon Chiffon
  '#E6E6FA', // Lavender
  '#98FB98', // Mint Green
  '#FFB6C1', // Light Pink
  '#C0C0C0', // Silver Metallic
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
 * Memberikan saran warna sekunder dari daftar permanen berdasarkan warna primer.
 */
export function getRecommendedSecondary(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex);
  
  // Jika primer cenderung gelap (L < 50), berikan sekunder yang sangat terang
  if (hsl.l < 50) {
    if (hsl.h <= 45 || hsl.h >= 340) return '#FFD700'; // Merah/Coklat Gelap -> Gold
    if (hsl.h > 150 && hsl.h <= 260) return '#00FFFF'; // Biru Gelap -> Cyan
    return '#FFFFFF'; // Sisanya -> Putih
  }
  
  // Jika primer sudah terang, cari kontras warna
  if (hsl.h > 240 && hsl.h < 340) return '#FFFFFF'; // Ungu -> Putih
  if (hsl.h > 45 && hsl.h <= 150) return '#FFFF00'; // Hijau -> Kuning
  
  return '#FFFFFF';
}

/**
 * Mengekstrak 20 palet warna dari gambar base64.
 * Diurutkan dari yang paling vibrant (terang/jenuh) ke yang lebih redup.
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
        if (a < 180) continue; // Abaikan pixel transparan

        // Kuantisasi warna untuk mengurangi noise
        const factor = 15; 
        const qr = Math.round(r / factor) * factor;
        const qg = Math.round(g / factor) * factor;
        const qb = Math.round(b / factor) * factor;
        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

        const hsl = hexToHsl(hex);
        
        // Singkirkan warna yang terlalu dekat dengan hitam pekat atau putih pekat murni
        if (hsl.l < 10 || hsl.l > 95) continue;

        // Scoring: Mix Saturasi dan Lightness. Warna vibrant di atas, redup di bawah.
        const score = (hsl.s * 3) + (hsl.l * 2); 

        if (!colors[hex]) {
          colors[hex] = { count: 1, score: score, hsl: hsl };
        } else {
          colors[hex].count++;
        }
      }

      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => b.score - a.score) // Urutkan berdasarkan Vibrancy Score
        .slice(0, 20) // Ambil 20 warna
        .map(([color]) => color);

      if (sortedColors.length < 5) return resolve(standardBackup);
      resolve(sortedColors);
    };
    img.onerror = () => resolve(['#FF0000', '#FFD700', '#00FFFF', '#FFFFFF']);
  });
}

export function getBestContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}
