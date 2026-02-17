'use client';

export default function GlobalError({
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
          Une erreur est survenue
        </h2>
        <p className="text-charcoal-600 mb-6">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-iris-purple text-white rounded-xl font-semibold hover:opacity-90 transition-all"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
