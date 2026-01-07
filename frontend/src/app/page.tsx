'use client';

import Link from 'next/link';
import { usePolls } from '@/hooks/usePolls';
import { PollCard } from '@/components/PollCard';
import { PollCardSkeleton } from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { data: polls, isLoading, error, refetch } = usePolls();

  return (
    <div className="animate-fadeIn">
      <section className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-6">
          <div className="w-4 h-4 bg-nutanix rounded flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">N</span>
          </div>
          Propulsé par Nutanix Kubernetes Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-charcoal-900 mb-4">
          Sondages en <span className="gradient-text">Temps Réel</span>
        </h1>
        <p className="text-lg text-charcoal-600 max-w-2xl mx-auto mb-8">
          Créez des sondages interactifs, partagez-les avec votre audience et regardez les résultats se mettre à jour instantanément.
        </p>
        <Link href="/create" className={cn(
          'inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-lg',
          'bg-nutanix hover:opacity-90',
          'transition-all duration-200 transform hover:scale-105 shadow-lg shadow-primary-500/30'
        )}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer un sondage
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-charcoal-900">Sondages actifs</h2>
          <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium text-charcoal-600 hover:bg-charcoal-50 transition-colors">
            <svg className={cn('w-5 h-5 inline-block mr-1', isLoading && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <PollCardSkeleton key={i} />)}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Erreur de chargement</h3>
            <p className="text-charcoal-600 mb-4">Impossible de charger les sondages.</p>
            <button onClick={() => refetch()} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">Réessayer</button>
          </div>
        )}

        {!isLoading && !error && polls && polls.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
          </div>
        )}

        {!isLoading && !error && polls && polls.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Aucun sondage actif</h3>
            <p className="text-charcoal-600 mb-6">Soyez le premier à créer un sondage !</p>
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              Créer un sondage
            </Link>
          </div>
        )}
      </section>

      {/* Features Section with secondary color accents */}
      <section className="mt-16 pt-12 border-t border-charcoal-100">
        <h2 className="text-2xl font-bold text-charcoal-900 text-center mb-8">Pourquoi Nutanix RealTime Poll ?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: '⚡', title: 'Temps Réel', description: 'WebSocket pour des mises à jour instantanées', accentColor: 'bg-secondary-cyan/10 border-secondary-cyan/20' },
            { icon: '📊', title: 'QR Code', description: 'Partagez facilement avec un QR code automatique', accentColor: 'bg-secondary-lime/10 border-secondary-lime/20' },
            { icon: '☸️', title: 'Kubernetes Ready', description: 'Déployable sur NKP en quelques minutes', accentColor: 'bg-secondary-coral/10 border-secondary-coral/20' },
          ].map((feature) => (
            <div key={feature.title} className={cn('text-center p-6 rounded-2xl border', feature.accentColor)}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-charcoal-900 mb-2">{feature.title}</h3>
              <p className="text-charcoal-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
