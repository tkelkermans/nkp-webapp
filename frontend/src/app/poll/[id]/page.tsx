'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { notFound } from 'next/navigation';
import { usePoll, useVote, useUpdatePollCache } from '@/hooks/usePolls';
import { useSocket } from '@/hooks/useSocket';
import { PollChart } from '@/components/PollChart';
import { VoteButtons } from '@/components/VoteButtons';
import { ShareButton } from '@/components/ShareButton';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { QRCode } from '@/components/QRCode';
import { cn, formatDate, getTimeRemaining } from '@/lib/utils';
import type { Poll } from '@/types';
import toast from 'react-hot-toast';

interface PollPageProps { params: Promise<{ id: string }>; }

export default function PollPage({ params }: PollPageProps) {
  const { id } = use(params);
  const { data: poll, isLoading, error } = usePoll(id);
  const voteMutation = useVote();
  const updatePollCache = useUpdatePollCache();
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'doughnut'>('bar');
  const [showQR, setShowQR] = useState(false);

  const handleVoteUpdate = useCallback((updatedPoll: Poll) => { updatePollCache(updatedPoll); }, [updatePollCache]);
  const handlePollClosed = useCallback((closedPollId: string) => {
    if (closedPollId === id) toast('Ce sondage a été fermé', { icon: '🔒' });
  }, [id]);

  const { status } = useSocket({ pollId: id, onVoteUpdate: handleVoteUpdate, onPollClosed: handlePollClosed });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}') as Record<string, string>;
      if (votedPolls[id]) { setHasVoted(true); setVotedOptionId(votedPolls[id] ?? null); }
    }
  }, [id]);

  const handleVote = async (optionId: string) => {
    if (hasVoted) return;
    try {
      await voteMutation.mutateAsync({ pollId: id, optionId });
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}') as Record<string, string>;
      votedPolls[id] = optionId;
      localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
      setHasVoted(true); setVotedOptionId(optionId);
      toast.success('Vote enregistré !');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du vote';
      if (message.includes('déjà voté')) setHasVoted(true);
      toast.error(message);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;
  if (error || !poll) return notFound();

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900 mb-2">{poll.question}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-500">
              <span>Créé le {formatDate(poll.createdAt)}</span>
              <span className={cn('px-2 py-0.5 rounded-full', poll.isActive ? 'bg-green-100 text-green-700' : 'bg-charcoal-100 text-charcoal-600')}>
                {poll.isActive ? 'Actif' : 'Fermé'}
              </span>
              <span>{getTimeRemaining(poll.expiresAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus status={status} />
            <button
              onClick={() => setShowQR(!showQR)}
              className={cn(
                'px-4 py-2 rounded-lg border-2 transition-all duration-200',
                showQR 
                  ? 'border-primary-500 text-primary-500 bg-primary-50' 
                  : 'border-charcoal-200 text-charcoal-700 hover:border-primary-500 hover:text-primary-500'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
            <ShareButton pollId={id} />
          </div>
        </div>

        {/* QR Code Panel */}
        {showQR && (
          <div className="mb-6 p-6 bg-charcoal-50 rounded-2xl border border-charcoal-100 flex flex-col md:flex-row items-center justify-center gap-6">
            <QRCode pollId={id} size={180} />
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Partagez ce sondage</h3>
              <p className="text-charcoal-600 text-sm max-w-xs">
                Affichez ce QR code sur un écran pour permettre à votre audience de voter facilement depuis leur téléphone.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-6">
          <h2 className="text-lg font-semibold text-charcoal-900 mb-4">{hasVoted ? 'Votre vote' : 'Votez maintenant'}</h2>
          <VoteButtons poll={poll} onVote={handleVote} isVoting={voteMutation.isPending} hasVoted={hasVoted} votedOptionId={votedOptionId} disabled={!poll.isActive} />
          <div className="mt-6 pt-4 border-t border-charcoal-100 text-center">
            <p className="text-3xl font-bold text-charcoal-900">{poll.totalVotes}</p>
            <p className="text-sm text-charcoal-500">vote{poll.totalVotes !== 1 ? 's' : ''} au total</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-900">Résultats</h2>
            <div className="flex rounded-lg border border-charcoal-200 overflow-hidden">
              <button onClick={() => setChartType('bar')} className={cn('px-3 py-1.5 text-sm font-medium transition-colors', chartType === 'bar' ? 'bg-primary-500 text-white' : 'bg-white text-charcoal-600 hover:bg-charcoal-50')}>Barres</button>
              <button onClick={() => setChartType('doughnut')} className={cn('px-3 py-1.5 text-sm font-medium transition-colors', chartType === 'doughnut' ? 'bg-primary-500 text-white' : 'bg-white text-charcoal-600 hover:bg-charcoal-50')}>Circulaire</button>
            </div>
          </div>
          <PollChart poll={poll} type={chartType} />
        </div>
      </div>

      {!hasVoted && poll.isActive && (
        <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-sm text-primary-700 text-center">💡 Cliquez sur une option pour voter. Les résultats se mettent à jour en temps réel.</p>
        </div>
      )}
    </div>
  );
}
