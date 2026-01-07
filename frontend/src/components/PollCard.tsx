'use client';

import Link from 'next/link';
import { cn, formatDate, getTimeRemaining } from '@/lib/utils';
import type { Poll } from '@/types';

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  const timeRemaining = getTimeRemaining(poll.expiresAt);
  const isExpiringSoon = poll.expiresAt && new Date(poll.expiresAt).getTime() - Date.now() < 60 * 60 * 1000;

  return (
    <Link
      href={`/poll/${poll.id}`}
      className={cn(
        'block p-6 rounded-2xl border-2 border-charcoal-100 bg-white',
        'hover:border-primary-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]'
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-charcoal-900 line-clamp-2">{poll.question}</h3>
        {/* Status badge using secondary lime as highlight for active */}
        <span className={cn(
          'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium',
          poll.isActive 
            ? 'bg-secondary-lime/20 text-charcoal-800 border border-secondary-lime/30' 
            : 'bg-charcoal-100 text-charcoal-600'
        )}>
          {poll.isActive ? 'Actif' : 'Fermé'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {poll.options.slice(0, 3).map((option) => (
          <span key={option.id} className="px-3 py-1 bg-charcoal-50 rounded-full text-sm text-charcoal-600">
            {option.text.length > 20 ? `${option.text.slice(0, 20)}...` : option.text}
          </span>
        ))}
        {poll.options.length > 3 && (
          <span className="px-3 py-1 bg-charcoal-50 rounded-full text-sm text-charcoal-500">+{poll.options.length - 3} autres</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-charcoal-500">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-primary-500">{poll.totalVotes}</span> vote{poll.totalVotes !== 1 ? 's' : ''}
          </span>
          <span>{poll.options.length} options</span>
        </div>
        {/* Expiring soon warning uses secondary coral */}
        <span className={cn(
          'text-sm',
          isExpiringSoon ? 'text-secondary-coral font-medium' : 'text-charcoal-500'
        )}>
          {timeRemaining}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-charcoal-100 text-xs text-charcoal-400">
        Créé le {formatDate(poll.createdAt)}
      </div>
    </Link>
  );
}

export default PollCard;
