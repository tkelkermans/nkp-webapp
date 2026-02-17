'use client';

import { cn } from '@/lib/utils';
import type { SocketStatus } from '@/types';

interface ConnectionStatusProps {
  status: SocketStatus;
  className?: string;
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  // Using secondary colors as status indicators (appropriate use as highlights)
  const statusConfig: Record<SocketStatus, { color: string; text: string; pulse: boolean }> = {
    connected: { color: 'bg-secondary-lime', text: 'Connecté', pulse: false },
    connecting: { color: 'bg-secondary-coral', text: 'Connexion...', pulse: true },
    disconnected: { color: 'bg-charcoal-400', text: 'Déconnecté', pulse: false },
    error: { color: 'bg-red-500', text: 'Erreur', pulse: false },
    reconnection_failed: { color: 'bg-red-500', text: 'Connexion perdue', pulse: false },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)} role="status" aria-live="polite">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.color)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', config.color)} />
      </span>
      <span className="text-xs text-charcoal-500">{config.text}</span>
    </div>
  );
}

export default ConnectionStatus;
