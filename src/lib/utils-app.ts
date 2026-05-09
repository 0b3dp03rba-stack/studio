
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
 * Mengekstrak palet warna dari gambar base64
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

      const colors: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue; // Skip transparan

        // Sederhanakan warna untuk pengelompokan (quantization sederhana)
        const factor = 16;
        const qr = Math.round(r / factor) * factor;
        const qg = Math.round(g / factor) * factor;
        const qb = Math.round(b / factor) * factor;
        
        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
        colors[hex] = (colors[hex] || 0) + 1;
      }

      // Urutkan berdasarkan frekuensi dan ambil 6 teratas
      const sortedColors = Object.entries(colors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([color]) => color);

      // Pastikan ada cukup warna
      while (sortedColors.length < 6) {
        sortedColors.push('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
      }

      resolve(sortedColors);
    };
    img.onerror = () => resolve(['#ff0000', '#00ffff', '#0000ff', '#00ff00', '#ff00ff', '#ffff00']);
  });
}

export function getBestContrastColor(hex: string): string {
  // Simple brightness calculation
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}
