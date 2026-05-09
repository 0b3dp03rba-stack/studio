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
