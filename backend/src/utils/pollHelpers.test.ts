import {
  calculatePollStats,
  isPollExpired,
  getTimeRemainingSeconds,
  formatTimeRemaining,
  generateResultsSummary,
} from './pollHelpers';
import type { Poll } from '../types/index.js';

// Helper pour créer un sondage de test
function createTestPoll(overrides: Partial<Poll> = {}): Poll {
  return {
    id: 'test-poll-id',
    question: 'Quel est le meilleur langage ?',
    options: [
      { id: 'opt1', text: 'JavaScript', votes: 10 },
      { id: 'opt2', text: 'TypeScript', votes: 25 },
      { id: 'opt3', text: 'Python', votes: 15 },
    ],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    totalVotes: 50,
    ...overrides,
  };
}

describe('Poll Helpers', () => {
  describe('calculatePollStats', () => {
    it('devrait calculer les statistiques correctement', () => {
      const poll = createTestPoll();

      const stats = calculatePollStats(poll);

      expect(stats.totalVotes).toBe(50);
      expect(stats.percentages['opt1']).toBe(20); // 10/50 = 20%
      expect(stats.percentages['opt2']).toBe(50); // 25/50 = 50%
      expect(stats.percentages['opt3']).toBe(30); // 15/50 = 30%
    });

    it('devrait identifier l\'option en tête', () => {
      const poll = createTestPoll();

      const stats = calculatePollStats(poll);

      expect(stats.leadingOption?.id).toBe('opt2');
      expect(stats.leadingOption?.text).toBe('TypeScript');
    });

    it('devrait gérer un sondage sans votes', () => {
      const poll = createTestPoll({
        options: [
          { id: 'opt1', text: 'Option 1', votes: 0 },
          { id: 'opt2', text: 'Option 2', votes: 0 },
        ],
      });

      const stats = calculatePollStats(poll);

      expect(stats.totalVotes).toBe(0);
      expect(stats.percentages['opt1']).toBe(0);
      expect(stats.percentages['opt2']).toBe(0);
      expect(stats.leadingOption).toBeNull();
    });

    it('devrait gérer une égalité', () => {
      const poll = createTestPoll({
        options: [
          { id: 'opt1', text: 'Option 1', votes: 10 },
          { id: 'opt2', text: 'Option 2', votes: 10 },
        ],
      });

      const stats = calculatePollStats(poll);

      expect(stats.totalVotes).toBe(20);
      expect(stats.percentages['opt1']).toBe(50);
      expect(stats.percentages['opt2']).toBe(50);
      // En cas d'égalité, la première option avec le max est retournée
      expect(stats.leadingOption?.id).toBe('opt1');
    });
  });

  describe('isPollExpired', () => {
    it('devrait retourner false pour un sondage non expiré', () => {
      const poll = createTestPoll({
        expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      });

      expect(isPollExpired(poll)).toBe(false);
    });

    it('devrait retourner true pour un sondage expiré', () => {
      const poll = createTestPoll({
        expiresAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      });

      expect(isPollExpired(poll)).toBe(true);
    });

    it('devrait retourner false si pas de date d\'expiration', () => {
      const poll = createTestPoll({ expiresAt: null });

      expect(isPollExpired(poll)).toBe(false);
    });
  });

  describe('getTimeRemainingSeconds', () => {
    it('devrait calculer le temps restant correctement', () => {
      const futureTime = new Date(Date.now() + 3600 * 1000).toISOString();

      const remaining = getTimeRemainingSeconds(futureTime);

      // Tolérance de 5 secondes pour le temps d'exécution
      expect(remaining).toBeGreaterThanOrEqual(3595);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('devrait retourner 0 pour une date passée', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString();

      expect(getTimeRemainingSeconds(pastTime)).toBe(0);
    });

    it('devrait retourner Infinity si pas de date', () => {
      expect(getTimeRemainingSeconds(null)).toBe(Infinity);
    });
  });

  describe('formatTimeRemaining', () => {
    it('devrait formater les jours', () => {
      expect(formatTimeRemaining(3 * 24 * 3600)).toBe('3 jours');
      expect(formatTimeRemaining(1 * 24 * 3600 + 3600)).toBe('1 jour');
    });

    it('devrait formater les heures et minutes', () => {
      expect(formatTimeRemaining(2 * 3600 + 30 * 60)).toBe('2h 30min');
      expect(formatTimeRemaining(1 * 3600)).toBe('1h 0min');
    });

    it('devrait formater les minutes seules', () => {
      expect(formatTimeRemaining(45 * 60)).toBe('45 minutes');
      expect(formatTimeRemaining(60)).toBe('1 minute');
    });

    it('devrait gérer les cas limites', () => {
      expect(formatTimeRemaining(0)).toBe('Expiré');
      expect(formatTimeRemaining(-1)).toBe('Expiré');
      expect(formatTimeRemaining(Infinity)).toBe('Pas d\'expiration');
    });
  });

  describe('generateResultsSummary', () => {
    it('devrait générer un résumé lisible', () => {
      const poll = createTestPoll();

      const summary = generateResultsSummary(poll);

      expect(summary).toContain(poll.question);
      expect(summary).toContain('50 votes');
      expect(summary).toContain('JavaScript');
      expect(summary).toContain('TypeScript');
      expect(summary).toContain('Python');
      expect(summary).toContain('En tête: TypeScript');
    });

    it('devrait gérer un sondage vide', () => {
      const poll = createTestPoll({
        options: [
          { id: 'opt1', text: 'A', votes: 0 },
          { id: 'opt2', text: 'B', votes: 0 },
        ],
      });

      const summary = generateResultsSummary(poll);

      expect(summary).toContain('0 votes');
      expect(summary).not.toContain('En tête');
    });
  });
});
