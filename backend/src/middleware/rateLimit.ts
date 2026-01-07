import rateLimit from 'express-rate-limit';
import { config } from '../utils/config.js';
import type { ApiResponse } from '../types/index.js';

/**
 * Rate limiter général pour l'API
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Utiliser X-Forwarded-For pour les proxies/load balancers
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
    }
    return req.ip ?? 'unknown';
  },
});

/**
 * Rate limiter strict pour les votes (anti-spam)
 */
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 votes par minute max
  message: {
    success: false,
    error: 'Trop de votes, veuillez patienter',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour la création de sondages
 */
export const createPollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 sondages par heure max
  message: {
    success: false,
    error: 'Trop de sondages créés, veuillez patienter',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
