import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-charcoal-100 mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-3xl font-bold text-charcoal-900 mb-2">Sondage non trouvé</h1>
        <p className="text-charcoal-600 mb-8 max-w-md mx-auto">
          Le sondage que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
            Voir les sondages actifs
          </Link>
          <Link href="/create" className="px-6 py-3 border-2 border-charcoal-200 text-charcoal-700 rounded-lg font-medium hover:border-charcoal-300 transition-colors">
            Créer un sondage
          </Link>
        </div>
      </div>
    </div>
  );
}
