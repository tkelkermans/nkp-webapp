import {
  validateCreatePoll,
  validateVote,
  validatePollId,
  sanitizeString,
} from './validation';

describe('Validation Utils', () => {
  describe('validateCreatePoll', () => {
    it('devrait valider un sondage correct', () => {
      const data = {
        question: 'Quel est le meilleur framework ?',
        options: ['React', 'Vue', 'Angular'],
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.question).toBe(data.question);
        expect(result.data.options).toHaveLength(3);
      }
    });

    it('devrait rejeter une question trop courte', () => {
      const data = {
        question: 'Ab',
        options: ['Option 1', 'Option 2'],
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter une question trop longue', () => {
      const data = {
        question: 'A'.repeat(501),
        options: ['Option 1', 'Option 2'],
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter moins de 2 options', () => {
      const data = {
        question: 'Question valide ?',
        options: ['Une seule option'],
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter plus de 10 options', () => {
      const data = {
        question: 'Question valide ?',
        options: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(false);
    });

    it('devrait valider avec expiryHours optionnel', () => {
      const data = {
        question: 'Question avec expiration ?',
        options: ['Oui', 'Non'],
        expiryHours: 48,
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiryHours).toBe(48);
      }
    });

    it('devrait rejeter expiryHours invalide', () => {
      const data = {
        question: 'Question valide ?',
        options: ['Oui', 'Non'],
        expiryHours: 200, // > 168 (7 jours)
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(false);
    });

    it('devrait trimmer les espaces', () => {
      const data = {
        question: '  Question avec espaces  ',
        options: ['  Option 1  ', '  Option 2  '],
      };

      const result = validateCreatePoll(data);

      expect(result.success).toBe(true);
    });
  });

  describe('validateVote', () => {
    it('devrait valider un vote correct', () => {
      const data = { optionId: 'abc123' };

      const result = validateVote(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optionId).toBe('abc123');
      }
    });

    it('devrait rejeter un optionId vide', () => {
      const data = { optionId: '' };

      const result = validateVote(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un optionId trop long', () => {
      const data = { optionId: 'a'.repeat(51) };

      const result = validateVote(data);

      expect(result.success).toBe(false);
    });

    it('devrait rejeter des données manquantes', () => {
      const data = {};

      const result = validateVote(data);

      expect(result.success).toBe(false);
    });
  });

  describe('validatePollId', () => {
    it('devrait valider un ID correct', () => {
      const result = validatePollId('abc123XYZ');

      expect(result.success).toBe(true);
    });

    it('devrait valider un ID avec tirets et underscores', () => {
      const result = validatePollId('abc-123_XYZ');

      expect(result.success).toBe(true);
    });

    it('devrait rejeter un ID avec caractères spéciaux', () => {
      const result = validatePollId('abc<script>');

      expect(result.success).toBe(false);
    });

    it('devrait rejeter un ID vide', () => {
      const result = validatePollId('');

      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('devrait échapper les caractères HTML', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';

      const result = sanitizeString(input);

      expect(result).toBe(expected);
    });

    it('devrait échapper les guillemets simples', () => {
      const input = "C'est un test";
      const expected = 'C&#x27;est un test';

      const result = sanitizeString(input);

      expect(result).toBe(expected);
    });

    it('devrait laisser le texte normal intact', () => {
      const input = 'Texte normal sans caractères spéciaux';

      const result = sanitizeString(input);

      expect(result).toBe(input);
    });

    it('devrait gérer une chaîne vide', () => {
      const result = sanitizeString('');

      expect(result).toBe('');
    });
  });
});
