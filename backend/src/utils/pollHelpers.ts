import type { Poll, PollOption } from '../types/index.js';

/**
 * Calcule les statistiques d'un sondage
 */
export function calculatePollStats(poll: Poll): {
  totalVotes: number;
  percentages: Record<string, number>;
  leadingOption: PollOption | null;
} {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  
  const percentages: Record<string, number> = {};
  let leadingOption: PollOption | null = null;
  let maxVotes = 0;

  for (const option of poll.options) {
    const percentage = totalVotes > 0 
      ? Math.round((option.votes / totalVotes) * 100)
      : 0;
    percentages[option.id] = percentage;

    if (option.votes > maxVotes) {
      maxVotes = option.votes;
      leadingOption = option;
    }
  }

  return {
    totalVotes,
    percentages,
    leadingOption,
  };
}

/**
 * Vérifie si un sondage a expiré
 */
export function isPollExpired(poll: Poll): boolean {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt) < new Date();
}

/**
 * Calcule le temps restant avant expiration en secondes
 */
export function getTimeRemainingSeconds(expiresAt: string | null): number {
  if (!expiresAt) return Infinity;
  
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const remaining = Math.floor((expiry - now) / 1000);
  
  return Math.max(0, remaining);
}

/**
 * Formate le temps restant en texte lisible
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === Infinity) return 'Pas d\'expiration';
  if (seconds <= 0) return 'Expiré';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

/**
 * Génère un résumé textuel des résultats
 */
export function generateResultsSummary(poll: Poll): string {
  const stats = calculatePollStats(poll);
  const lines: string[] = [
    `📊 ${poll.question}`,
    `Total: ${stats.totalVotes} vote${stats.totalVotes !== 1 ? 's' : ''}`,
    '',
  ];

  for (const option of poll.options) {
    const percentage = stats.percentages[option.id] ?? 0;
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    lines.push(`${option.text}: ${bar} ${percentage}% (${option.votes})`);
  }

  if (stats.leadingOption) {
    lines.push('');
    lines.push(`🏆 En tête: ${stats.leadingOption.text}`);
  }

  return lines.join('\n');
}
