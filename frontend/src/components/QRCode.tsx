'use client';

import { useState, useEffect } from 'react';
import { getQRCodeUrl, getPollShareUrl } from '@/lib/utils';

interface QRCodeProps {
  pollId: string;
  size?: number;
  className?: string;
}

/**
 * QR Code component that generates a QR code for the poll URL
 * Works with any environment (local, Kubernetes with Ingress, Cloudflare Tunnel)
 */
export function QRCode({ pollId, size = 150, className = '' }: QRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate URL on client side to get the correct origin
    const pollUrl = getPollShareUrl(pollId);
    if (pollUrl) {
      setQrUrl(getQRCodeUrl(pollUrl, size));
      setIsLoading(false);
    }
  }, [pollId, size]);

  if (isLoading || !qrUrl) {
    return (
      <div 
        className={`bg-charcoal-100 animate-pulse rounded-lg ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white p-3 rounded-xl shadow-sm border border-charcoal-100">
        <img
          src={qrUrl}
          alt="QR Code pour accéder au sondage"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      <p className="text-xs text-charcoal-500 text-center">
        Scannez pour voter
      </p>
    </div>
  );
}

export default QRCode;
