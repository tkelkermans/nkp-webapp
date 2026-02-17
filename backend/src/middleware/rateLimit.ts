import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../models/redis.js';
import { config } from '../utils/config.js';
import type { ApiResponse } from '../types/index.js';

// Redis store for distributed rate limiting
const createRedisStore = (prefix: string) => new RedisStore({
  // Use the ioredis `call` method to send raw commands
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
  prefix: `rl:${prefix}:`,
});

/**
 * Rate limiter général pour l'API
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  store: createRedisStore('api'),
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
  store: createRedisStore('vote'),
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
  store: createRedisStore('create'),
  message: {
    success: false,
    error: 'Trop de sondages créés, veuillez patienter',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
