import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function getTimeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return "Pas d'expiration";
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return 'Expiré';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) return `${hours}h ${minutes}min restant${hours > 1 ? 's' : ''}`;
  return `${minutes} minute${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ========================================
// NUTANIX CHART COLORS
// ========================================
// Primary: Iris Purple (#7855fa), Charcoal (#131313)
// Secondary (highlights): Cyan (#1fdde9), Lime (#92dd23), Coral (#ff9178)
// 
// Order: Primary first, then secondary as accents
export const chartColors = [
  '#7855fa', // Iris Purple (primary)
  '#1fdde9', // Cyan (secondary)
  '#92dd23', // Lime (secondary)
  '#ff9178', // Coral (secondary)
  '#131313', // Charcoal (primary)
  '#a78bfa', // Purple light variant
  '#0cb8c4', // Cyan dark variant
  '#6fb31a', // Lime dark variant
];

export function getChartColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(chartColors[i % chartColors.length]!);
  }
  return colors;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function getPollShareUrl(pollId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/poll/${pollId}`;
}

/**
 * Generate QR code URL using QR Server API
 * Works in any environment including Kubernetes with Ingress
 * Uses Charcoal color for the QR code
 */
export function getQRCodeUrl(url: string, size: number = 200): string {
  const encodedUrl = encodeURIComponent(url);
  // Using charcoal (131313) for QR code on white background
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&color=131313&bgcolor=ffffff`;
}
