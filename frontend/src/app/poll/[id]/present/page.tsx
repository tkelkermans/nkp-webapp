'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import type { Poll } from '@/types';
import PollChart from '@/components/PollChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConnectionStatus from '@/components/ConnectionStatus';
import QRCode from '@/components/QRCode';

export default function PresentPage() {
  const params = useParams();
  const pollId = params.id as string;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [showQR, setShowQR] = useState(true);

  // Charger le sondage initial
  const { data: initialPoll, isLoading, error } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: () => api.getPoll(pollId),
    enabled: !!pollId,
    refetchInterval: false,
  });

  // Connexion WebSocket pour les mises à jour en temps réel
  const { status } = useSocket({
    pollId,
    onVoteUpdate: (updatedPoll) => {
      setPoll(updatedPoll);
    },
  });

  // Mettre à jour l'état local quand les données initiales arrivent
  useEffect(() => {
    if (initialPoll) {
      setPoll(initialPoll);
    }
  }, [initialPoll]);

  // Raccourci clavier pour afficher/masquer le QR code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        setShowQR((prev) => !prev);
      }
      // F11 pour plein écran
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement du sondage..." />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Sondage non trouvé</h1>
          <p className="text-gray-400">Le sondage demandé n&apos;existe pas ou a expiré.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-bold mb-4 text-white">{poll.question}</h1>
          <div className="flex items-center gap-4">
            <span className="text-2xl text-gray-400">
              {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
            </span>
            <ConnectionStatus status={status} />
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="bg-white p-4 rounded-xl shadow-2xl">
            <QRCode pollId={pollId} size={200} />
          </div>
        )}
      </div>

      {/* Graphique principal */}
      <div className="flex-1">
        <PollChart poll={poll} type="bar" showPercentage animate />
      </div>

      {/* Footer avec instructions */}
      <div className="fixed bottom-4 left-4 text-gray-500 text-sm">
        <p>Appuyez sur <kbd className="px-2 py-1 bg-gray-800 rounded">Q</kbd> pour afficher/masquer le QR code</p>
        <p>Appuyez sur <kbd className="px-2 py-1 bg-gray-800 rounded">F11</kbd> pour le mode plein écran</p>
      </div>

      {/* Logo Nutanix */}
      <div className="fixed bottom-4 right-4">
        <div className="text-iris-purple text-2xl font-bold">
          Nutanix
        </div>
      </div>
    </div>
  );
}
