import { z } from 'zod';

/**
 * Schéma de validation pour la création d'un sondage
 */
export const createPollSchema = z.object({
  question: z
    .string()
    .min(3, 'La question doit contenir au moins 3 caractères')
    .max(500, 'La question ne peut pas dépasser 500 caractères')
    .trim(),
  options: z
    .array(
      z
        .string()
        .min(1, "L'option ne peut pas être vide")
        .max(200, "L'option ne peut pas dépasser 200 caractères")
        .trim()
    )
    .min(2, 'Il faut au moins 2 options')
    .max(10, 'Maximum 10 options autorisées'),
  expiryHours: z
    .number()
    .int()
    .min(1, 'Expiration minimum: 1 heure')
    .max(168, 'Expiration maximum: 7 jours (168 heures)')
    .optional(),
});

/**
 * Schéma de validation pour un vote
 */
export const voteSchema = z.object({
  optionId: z
    .string()
    .min(1, "L'ID de l'option est requis")
    .max(50, 'ID invalide'),
});

/**
 * Schéma de validation pour l'ID d'un sondage
 */
export const pollIdSchema = z.object({
  id: z
    .string()
    .min(1, "L'ID du sondage est requis")
    .max(50, 'ID invalide')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID contient des caractères invalides'),
});

/**
 * Valide les données de création d'un sondage
 */
export function validateCreatePoll(data: unknown) {
  return createPollSchema.safeParse(data);
}

/**
 * Valide les données d'un vote
 */
export function validateVote(data: unknown) {
  return voteSchema.safeParse(data);
}

/**
 * Valide l'ID d'un sondage
 */
export function validatePollId(id: unknown) {
  return pollIdSchema.safeParse({ id });
}

/**
 * Sanitize une chaîne pour éviter XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export type CreatePollData = z.infer<typeof createPollSchema>;
export type VoteData = z.infer<typeof voteSchema>;
