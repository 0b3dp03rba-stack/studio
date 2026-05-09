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

export function validateGmailFormat(input: string) {
  const lines = input.split('\n').filter(l => l.trim() !== '');
  const items: { email: string; pass: string }[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const parts = line.split('|');
    if (parts.length !== 2) {
      errors.push(`Baris ${index + 1}: Format salah (Email|Password)`);
      return;
    }
    const [email, pass] = parts.map(p => p.trim());
    if (!email || !pass) {
      errors.push(`Baris ${index + 1}: Email atau password kosong`);
      return;
    }
    // Basic email regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Baris ${index + 1}: Format email tidak valid`);
      return;
    }
    items.push({ email, pass });
  });

  return { items, errors };
}

/**
 * Mengompresi dan memotong gambar menjadi rasio 1:1 (persegi)
 * Berguna untuk menjaga ukuran dokumen Firestore di bawah 1MB
 */
export async function compressAndCropImage(file: File, targetSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal mendapatkan konteks canvas'));
          return;
        }

        // Tentukan dimensi potong (Square dari tengah)
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        // Set ukuran output
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Gambar ke canvas dengan cropping 1:1
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize, // Source (crop dari tengah)
          0, 0, targetSize, targetSize             // Destination (resized)
        );

        // Export sebagai JPEG dengan kualitas 0.7 untuk ukuran file minimal
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Mengekstrak warna tema dominan dari string base64 gambar
 */
export async function extractThemeColors(base64: string): Promise<{ primary: string; secondary: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ primary: '#ff0000', secondary: '#ffea00' });

      // Gunakan ukuran sampel kecil untuk performa
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;

      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      const count = data.length / 4;
      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);

      const toHex = (c: number) => c.toString(16).padStart(2, '0');
      const primary = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`;

      // Generate warna sekunder yang lebih cerah/kontras untuk gradasi
      const secondary = `#${toHex(Math.min(255, avgR + 50))}${toHex(Math.min(255, avgG + 30))}${toHex(Math.max(0, avgB - 30))}`;

      resolve({ primary, secondary });
    };
    img.onerror = () => resolve({ primary: '#ff0000', secondary: '#ffea00' });
  });
}
