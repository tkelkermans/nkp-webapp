'use client';

import { useState } from 'react';
import { cn, getChartColors, calculatePercentage } from '@/lib/utils';
import type { Poll } from '@/types';

interface VoteButtonsProps {
  poll: Poll;
  onVote: (optionId: string) => void;
  isVoting?: boolean;
  hasVoted?: boolean;
  votedOptionId?: string | null;
  disabled?: boolean;
}

export function VoteButtons({ poll, onVote, isVoting = false, hasVoted = false, votedOptionId = null, disabled = false }: VoteButtonsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const colors = getChartColors(poll.options.length);
  const isDisabled = disabled || isVoting || !poll.isActive;

  const handleVote = (optionId: string) => {
    if (isDisabled) return;
    setSelectedOption(optionId);
    onVote(optionId);
  };

  return (
    <div className="space-y-3" role="group" aria-label="Options de vote">
      {poll.options.map((option, index) => {
        const percentage = calculatePercentage(option.votes, poll.totalVotes);
        const isSelected = selectedOption === option.id || votedOptionId === option.id;
        const color = colors[index]!;

        return (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={isDisabled || hasVoted}
            aria-label={`${option.text}: ${option.votes} vote${option.votes !== 1 ? 's' : ''}, ${percentage}%`}
            className={cn(
              'relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden group',
              isSelected && 'ring-2 ring-offset-2',
              hasVoted || !poll.isActive ? 'cursor-default' : 'hover:scale-[1.01] cursor-pointer',
              isDisabled && !hasVoted && 'opacity-50'
            )}
            style={{ borderColor: isSelected ? color : '#e3e3e3' }}
          >
            {(hasVoted || poll.totalVotes > 0) && (
              <div className="absolute inset-0 transition-all duration-500 ease-out" style={{ width: `${percentage}%`, backgroundColor: `${color}20` }} />
            )}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0', isSelected && 'scale-110')}
                  style={{ borderColor: color, backgroundColor: isSelected ? color : 'transparent' }} />
                <span className="font-medium text-charcoal-900">{option.text}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal-600">
                <span>{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                {poll.totalVotes > 0 && <span className="font-semibold text-charcoal-900 min-w-[3rem] text-right">{percentage}%</span>}
              </div>
            </div>
            {isVoting && isSelected && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="w-6 h-6 border-2 border-charcoal-300 border-t-primary-500 rounded-full animate-spin" />
              </div>
            )}
          </button>
        );
      })}

      {hasVoted && <p className="text-center text-green-600 font-medium mt-4">✓ Votre vote a été enregistré !</p>}
      {!poll.isActive && <p className="text-center text-amber-600 font-medium mt-4">Ce sondage est fermé</p>}
    </div>
  );
}

export default VoteButtons;
