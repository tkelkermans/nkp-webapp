'use client';

export default function PollError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-charcoal-900 mb-4">
          Erreur de chargement du sondage
        </h2>
        <p className="text-charcoal-600 mb-6">
          {error.message || "Impossible de charger ce sondage. Il a peut-être expiré ou été supprimé."}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-iris-purple text-white rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="px-6 py-3 border-2 border-charcoal-200 text-charcoal-700 rounded-xl font-semibold hover:border-iris-purple hover:text-iris-purple transition-all"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
