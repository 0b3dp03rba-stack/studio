
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
 */
export function getRecommendedSecondary(primaryHex: string): string {
  const hsl = hexToHsl(primaryHex);
  
  // MERAH / COKLAT / ORANGE / MARUN -> Pasangkan dengan GOLD (Mewah)
  if (hsl.h <= 45 || hsl.h >= 340) {
    return '#FFD700'; 
  }
  
  // KUNING / LIME -> Pasangkan dengan PUTIH atau HITAM (Gunakan Putih untuk tema Linku)
  if (hsl.h > 45 && hsl.h <= 85) {
    return '#FFFFFF';
  }

  // HIJAU / TOSKA -> Pasangkan dengan CYAN atau PUTIH
  if (hsl.h > 85 && hsl.h <= 170) {
    return '#00FFFF';
  }

  // BIRU -> Pasangkan dengan CYAN atau PUTIH KRISTAL
  if (hsl.h > 170 && hsl.h <= 255) {
    return '#00FFFF';
  }

  // UNGU / MAGENTA -> Pasangkan dengan GOLD atau PUTIH
  if (hsl.h > 255 && hsl.h < 340) {
    return '#FFD700';
  }
  
  return '#FFFFFF';
}

/**
 * Mengekstrak palet warna dari gambar base64 dengan prioritas pada warna cerah/vibrant.
 */
export async function extractPaletteFromImage(base64: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const luxuryBackup = ['#FF0000', '#FFD700', '#00FFFF', '#FFFFFF', '#FF00FF', '#00FF00', '#FFA500', '#0000FF'];
      
      if (!ctx) return resolve(luxuryBackup);

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
        if (a < 200) continue; // Abaikan pixel transparan

        const factor = 10; // Grup warna yang mirip
        const qr = Math.round(r / factor) * factor;
        const qg = Math.round(g / factor) * factor;
        const qb = Math.round(b / factor) * factor;
        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

        const hsl = hexToHsl(hex);
        
        // FILTER SANGAT AGRESIF: Buang warna gelap (L < 40) atau kusam (S < 30)
        if (hsl.l < 40 || hsl.s < 30) continue;

        // SCORING: Utamakan Saturation dan Lightness yang tinggi
        const score = (hsl.s * 3) + (hsl.l * 2); 

        if (!colors[hex]) {
          colors[hex] = { count: 1, score: score };
        } else {
          colors[hex].count++;
        }
      }

      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => (b.score * b.count) - (a.score * a.count))
        .slice(0, 8)
        .map(([color]) => color);

      // Jika tidak ditemukan warna cerah dari gambar, gunakan backup warna mewah
      if (sortedColors.length < 4) {
        return resolve(luxuryBackup);
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
