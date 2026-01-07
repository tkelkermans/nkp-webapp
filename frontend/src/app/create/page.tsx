import { CreatePollForm } from '@/components/CreatePollForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un sondage - Nutanix RealTime Poll',
  description: 'Créez un nouveau sondage interactif en temps réel.',
};

export default function CreatePollPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-charcoal-900 mb-2">Créer un sondage</h1>
        <p className="text-charcoal-600">Posez votre question et ajoutez les options de réponse.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-6 md:p-8">
        <CreatePollForm />
      </div>
      <div className="mt-8 p-6 bg-primary-50 rounded-xl border border-primary-100">
        <h2 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
          <span>💡</span> Conseils
        </h2>
        <ul className="space-y-2 text-sm text-primary-600">
          <li>• Formulez une question claire et concise</li>
          <li>• Proposez des options distinctes et sans ambiguïté</li>
          <li>• 3 à 5 options sont généralement optimales</li>
          <li>• Utilisez le QR code pour partager facilement avec votre audience</li>
        </ul>
      </div>
    </div>
  );
}
