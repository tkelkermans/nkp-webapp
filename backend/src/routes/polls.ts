import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import * as PollModel from '../models/poll.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { voteLimiter, createPollLimiter } from '../middleware/rateLimit.js';
import { validateCreatePoll, validateVote, validatePollId } from '../utils/validation.js';
import type { ApiResponse, Poll, CreatePollInput } from '../types/index.js';

const router = Router();

/**
 * Génère un ID de voteur unique basé sur l'IP et User-Agent
 */
function generateVoterId(req: Request): string {
  const ip = req.headers['x-forwarded-for'] ?? req.ip ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? '';
  const fingerprint = `${ip}:${userAgent}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 32);
}

/**
 * @openapi
 * /polls:
 *   get:
 *     tags:
 *       - Polls
 *     summary: Liste des sondages actifs
 *     description: Retourne tous les sondages non expirés
 *     responses:
 *       200:
 *         description: Liste des sondages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Poll'
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response<ApiResponse<Poll[]>>) => {
    const polls = await PollModel.getActivePolls();
    
    res.json({
      success: true,
      data: polls,
    });
  })
);

/**
 * @openapi
 * /polls:
 *   post:
 *     tags:
 *       - Polls
 *     summary: Créer un nouveau sondage
 *     description: Crée un sondage avec une question et des options de réponse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePollInput'
 *     responses:
 *       201:
 *         description: Sondage créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       400:
 *         description: Données invalides
 *       429:
 *         description: Trop de requêtes (rate limiting)
 */
router.post(
  '/',
  createPollLimiter,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Poll>>) => {
    const validation = validateCreatePoll(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: validation.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const input: CreatePollInput = validation.data;
    const poll = await PollModel.createPoll(input);

    res.status(201).json({
      success: true,
      data: poll,
      message: 'Sondage créé avec succès',
    });
  })
);

/**
 * @openapi
 * /polls/{id}:
 *   get:
 *     tags:
 *       - Polls
 *     summary: Récupérer un sondage
 *     description: Retourne les détails d'un sondage spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du sondage
 *     responses:
 *       200:
 *         description: Détails du sondage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       404:
 *         description: Sondage non trouvé
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response<ApiResponse<Poll>>) => {
    const { id } = req.params;
    
    const idValidation = validatePollId(id);
    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
      return;
    }

    const poll = await PollModel.getPollById(id!);

    if (!poll) {
      res.status(404).json({
        success: false,
        error: 'Sondage non trouvé',
      });
      return;
    }

    res.json({
      success: true,
      data: poll,
    });
  })
);

/**
 * @openapi
 * /polls/{id}/vote:
 *   post:
 *     tags:
 *       - Polls
 *     summary: Voter sur un sondage
 *     description: Enregistre un vote pour une option. Un utilisateur ne peut voter qu'une fois par sondage.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du sondage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteInput'
 *     responses:
 *       200:
 *         description: Vote enregistré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       404:
 *         description: Sondage non trouvé
 *       409:
 *         description: Déjà voté sur ce sondage
 *       429:
 *         description: Trop de requêtes (rate limiting)
 */
router.post(
  '/:id/vote',
  voteLimiter,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Poll>>) => {
    const { id } = req.params;

    const idValidation = validatePollId(id);
    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
      return;
    }

    const voteValidation = validateVote(req.body);
    if (!voteValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Données de vote invalides',
        message: voteValidation.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { optionId } = voteValidation.data;
    const voterId = generateVoterId(req);

    try {
      const poll = await PollModel.vote(id!, optionId, voterId);

      res.json({
        success: true,
        data: poll!,
        message: 'Vote enregistré',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du vote';
      
      // Déterminer le code de statut approprié
      let statusCode = 400;
      if (message.includes('non trouvé')) {
        statusCode = 404;
      } else if (message.includes('déjà voté')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  })
);

/**
 * @openapi
 * /polls/{id}:
 *   delete:
 *     tags:
 *       - Polls
 *     summary: Supprimer un sondage
 *     description: Supprime définitivement un sondage et ses votes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du sondage
 *     responses:
 *       200:
 *         description: Sondage supprimé
 *       404:
 *         description: Sondage non trouvé
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;

    const idValidation = validatePollId(id);
    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
      return;
    }

    const deleted = await PollModel.deletePoll(id!);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Sondage non trouvé',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Sondage supprimé',
    });
  })
);

/**
 * @openapi
 * /polls/{id}/close:
 *   post:
 *     tags:
 *       - Polls
 *     summary: Fermer un sondage
 *     description: Ferme un sondage pour empêcher de nouveaux votes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du sondage
 *     responses:
 *       200:
 *         description: Sondage fermé
 *       404:
 *         description: Sondage non trouvé
 */
router.post(
  '/:id/close',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;

    const idValidation = validatePollId(id);
    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
      return;
    }

    const closed = await PollModel.closePoll(id!);

    if (!closed) {
      res.status(404).json({
        success: false,
        error: 'Sondage non trouvé',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Sondage fermé',
    });
  })
);

/**
 * @openapi
 * /polls/{id}/export:
 *   get:
 *     tags:
 *       - Polls
 *     summary: Exporter les résultats d'un sondage
 *     description: Exporte les résultats au format CSV
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du sondage
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Format d'export
 *     responses:
 *       200:
 *         description: Résultats exportés
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Poll'
 *       404:
 *         description: Sondage non trouvé
 */
router.get(
  '/:id/export',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const format = (req.query['format'] as string) || 'csv';

    const idValidation = validatePollId(id);
    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        error: 'ID invalide',
      });
      return;
    }

    const poll = await PollModel.getPollById(id!);

    if (!poll) {
      res.status(404).json({
        success: false,
        error: 'Sondage non trouvé',
      });
      return;
    }

    if (format === 'json') {
      res.json({
        success: true,
        data: poll,
      });
      return;
    }

    // Format CSV
    const csvRows = [
      ['Question', poll.question],
      ['Créé le', poll.createdAt],
      ['Expire le', poll.expiresAt || 'N/A'],
      ['Total votes', poll.totalVotes.toString()],
      ['Statut', poll.isActive ? 'Actif' : 'Fermé'],
      [],
      ['Option', 'Votes', 'Pourcentage'],
    ];

    for (const option of poll.options) {
      const percentage = poll.totalVotes > 0 
        ? ((option.votes / poll.totalVotes) * 100).toFixed(1) 
        : '0';
      csvRows.push([option.text, option.votes.toString(), `${percentage}%`]);
    }

    const csvContent = csvRows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="poll-${id}-results.csv"`);
    res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 compatibility
  })
);

export default router;
