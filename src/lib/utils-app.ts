
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
 * Memberikan saran warna sekunder yang mewah (Prestige Pairs) berdasarkan warna utama.
 * Fokus pada kontras tinggi dan estetika premium (Gold, White, Cyan).
 */
export function getRecommendedSecondary(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex);
  
  // MERAH / COKLAT / ORANGE -> Pasangkan dengan GOLD (Mewah)
  if (hsl.h <= 45 || hsl.h >= 340) {
    return '#FFD700'; 
  }
  
  // KUNING -> Pasangkan dengan PUTIH atau HITAM
  if (hsl.h > 45 && hsl.h <= 70) {
    return '#FFFFFF';
  }

  // HIJAU -> Pasangkan dengan PUTIH KRISTAL
  if (hsl.h > 70 && hsl.h <= 160) {
    return '#F0FFF0';
  }

  // BIRU -> Pasangkan dengan CYAN atau PUTIH
  if (hsl.h > 180 && hsl.h <= 260) {
    return '#00FFFF';
  }

  // UNGU / MAGENTA -> Pasangkan dengan GOLD atau PUTIH
  if (hsl.h > 260 && hsl.h < 340) {
    return '#FFD700';
  }
  
  // Default fallback: Putih bersih
  return '#FFFFFF';
}

/**
 * Mengekstrak palet warna dari gambar base64 dengan prioritas pada warna cerah/vibrant.
 * Warna gelap dan kusam akan difilter secara agresif.
 */
export async function extractPaletteFromImage(base64: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(['#ff0000', '#FFD700', '#00FFFF', '#FFFFFF']);

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
        
        // FILTER AGRESIF: Abaikan warna yang terlalu gelap (L < 35) atau kusam (S < 20)
        // Ini memastikan warna "coklat gelap" atau "hitam" tidak mendominasi palet pilihan.
        if (hsl.l < 35 || hsl.s < 20) continue;

        // SCORING: Berikan bobot tinggi pada Saturation (Kepekatan Warna)
        const score = (hsl.s * 2.5) + hsl.l; 

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

      // Fallback jika tidak ditemukan warna vibrant yang cukup
      if (sortedColors.length === 0) {
        return resolve(['#FF0000', '#FFD700', '#00FFFF', '#FFFFFF', '#FF00FF', '#00FF00']);
      }

      // Pastikan palet berisi minimal 6 pilihan warna
      while (sortedColors.length < 6) {
        sortedColors.push('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
      }

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
