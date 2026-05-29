import { Metadata } from 'next';
import PaymentClient from './PaymentClient';

export const metadata: Metadata = {
  title: 'Identity Authentication | Linku',
  description: 'Selesaikan pembayaran QRIS untuk mengaktifkan fitur premium Linku.',
};

export default async function PaymentPage({ params }: { params: Promise<{ depositId: string }> }) {
  const { depositId } = await params;
  return <PaymentClient depositId={depositId} />;
}
