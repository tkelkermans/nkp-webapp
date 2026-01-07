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
 * GET /api/polls - Liste des sondages actifs
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
 * POST /api/polls - Créer un nouveau sondage
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
 * GET /api/polls/:id - Récupérer un sondage
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
 * POST /api/polls/:id/vote - Voter sur un sondage
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
 * DELETE /api/polls/:id - Supprimer un sondage
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
 * POST /api/polls/:id/close - Fermer un sondage
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

export default router;
