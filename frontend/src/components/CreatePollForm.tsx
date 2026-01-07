'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePoll } from '@/hooks/usePolls';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FormOption { id: number; value: string; }

export function CreatePollForm() {
  const router = useRouter();
  const createPoll = useCreatePoll();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<FormOption[]>([{ id: 1, value: '' }, { id: 2, value: '' }]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [nextOptionId, setNextOptionId] = useState(3);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, { id: nextOptionId, value: '' }]);
    setNextOptionId(nextOptionId + 1);
  };

  const removeOption = (id: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const updateOption = (id: number, value: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, value } : opt)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 3) { toast.error('La question doit contenir au moins 3 caractères'); return; }
    const validOptions = options.map((opt) => opt.value.trim()).filter((val) => val.length > 0);
    if (validOptions.length < 2) { toast.error('Il faut au moins 2 options'); return; }
    const uniqueOptions = new Set(validOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) { toast.error('Les options doivent être uniques'); return; }

    try {
      const poll = await createPoll.mutateAsync({ question: question.trim(), options: validOptions, expiryHours });
      toast.success('Sondage créé avec succès !');
      router.push(`/poll/${poll.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="question" className="block text-sm font-medium text-charcoal-700 mb-2">Question du sondage *</label>
        <input id="question" type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ex: Quel est le meilleur fournisseur cloud ?" maxLength={500} required
          className="w-full px-4 py-3 rounded-xl border-2 border-charcoal-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none text-lg text-charcoal-900" />
        <p className="mt-1 text-sm text-charcoal-500">{question.length}/500 caractères</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-2">Options de réponse *</label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex gap-2">
              <input type="text" value={option.value} onChange={(e) => updateOption(option.id, e.target.value)} placeholder={`Option ${index + 1}`} maxLength={200}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-charcoal-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none text-charcoal-900" />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(option.id)} className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 10 && (
          <button type="button" onClick={addOption} className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-charcoal-300 text-charcoal-600 hover:border-primary-400 hover:text-primary-500 transition-all">
            + Ajouter une option
          </button>
        )}
        <p className="mt-2 text-sm text-charcoal-500">{options.length}/10 options</p>
      </div>

      <div>
        <label htmlFor="expiry" className="block text-sm font-medium text-charcoal-700 mb-2">Durée du sondage</label>
        <select id="expiry" value={expiryHours} onChange={(e) => setExpiryHours(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border-2 border-charcoal-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none bg-white text-charcoal-900">
          <option value={1}>1 heure</option>
          <option value={6}>6 heures</option>
          <option value={12}>12 heures</option>
          <option value={24}>24 heures</option>
          <option value={48}>2 jours</option>
          <option value={72}>3 jours</option>
          <option value={168}>7 jours</option>
        </select>
      </div>

      <button type="submit" disabled={createPoll.isPending}
        className={cn(
          'w-full py-4 px-6 rounded-xl font-semibold text-white',
          'bg-nutanix hover:opacity-90',
          'transition-all duration-200 transform hover:scale-[1.02]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-primary-500/30'
        )}>
        {createPoll.isPending ? 'Création en cours...' : 'Créer le sondage'}
      </button>
    </form>
  );
}

export default CreatePollForm;
