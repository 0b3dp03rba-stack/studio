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
