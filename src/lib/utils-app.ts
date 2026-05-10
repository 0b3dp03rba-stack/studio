
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
 * Memberikan saran warna sekunder yang mewah berdasarkan warna utama
 */
export function getRecommendedSecondary(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex);
  
  // Logika pasangan warna mewah (Prestige Pairs)
  if (hsl.h >= 340 || hsl.h <= 20) return '#FFD700'; // Merah -> Gold
  if (hsl.h > 20 && hsl.h <= 50) return '#FFFFFF';  // Orange -> Putih
  if (hsl.h > 50 && hsl.h <= 70) return '#000000';  // Kuning -> Hitam (Contrast)
  if (hsl.h > 180 && hsl.h <= 260) return '#00FFFF'; // Biru -> Cyan
  if (hsl.h > 260 && hsl.h <= 300) return '#FF00FF'; // Ungu -> Magenta/Pink
  if (hsl.h > 100 && hsl.h <= 160) return '#F0FFF0'; // Hijau -> Honeydew/Putih
  
  // Default fallback: Versi lebih terang atau putih
  return hsl.l < 50 ? '#FFFFFF' : '#F0F0F0';
}

/**
 * Mengekstrak palet warna dari gambar base64 dengan prioritas pada warna cerah/vibrant
 */
export async function extractPaletteFromImage(base64: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(['#ff0000', '#00ffff', '#0000ff', '#00ff00', '#ff00ff', '#ffff00']);

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;

      const colors: Record<string, { count: number, score: number }> = {};
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue;

        const factor = 16;
        const qr = Math.round(r / factor) * factor;
        const qg = Math.round(g / factor) * factor;
        const qb = Math.round(b / factor) * factor;
        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

        const hsl = hexToHsl(hex);
        
        // FILTER: Abaikan warna yang terlalu gelap (L < 25) atau terlalu kusam (S < 15)
        if (hsl.l < 25 || hsl.s < 15) continue;

        // SCORING: Berikan skor lebih tinggi untuk warna yang cerah dan jenuh
        const score = (hsl.s * 2) + hsl.l; 

        if (!colors[hex]) {
          colors[hex] = { count: 1, score: score };
        } else {
          colors[hex].count++;
        }
      }

      // Urutkan berdasarkan Skor Vibrancy + Frekuensi
      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => (b.score * b.count) - (a.score * a.count))
        .slice(0, 8)
        .map(([color]) => color);

      // Fallback jika tidak ditemukan warna vibrant
      if (sortedColors.length === 0) {
        return resolve(['#ff0000', '#FFD700', '#00ffff', '#0000ff', '#ff00ff', '#ffffff']);
      }

      while (sortedColors.length < 8) {
        sortedColors.push('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
      }

      resolve(sortedColors);
    };
    img.onerror = () => resolve(['#ff0000', '#FFD700', '#00ffff', '#0000ff', '#ff00ff', '#ffffff']);
  });
}

export function getBestContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}
