import dotenv from 'dotenv';
import type { AppConfig } from '../types/index.js';

// Charger les variables d'environnement
dotenv.config();

/**
 * Configuration de l'application avec valeurs par défaut
 */
export const config: AppConfig = {
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  sessionSecret: process.env['SESSION_SECRET'] ?? 'development-secret-change-me',
  rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
  rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100', 10),
  pollExpiryHours: parseInt(process.env['POLL_EXPIRY_HOURS'] ?? '24', 10),
  maxOptionsPerPoll: parseInt(process.env['MAX_OPTIONS_PER_POLL'] ?? '10', 10),
};

/**
 * Vérifie que la configuration est valide
 * Uses dynamic import for logger to avoid circular dependency (logger imports config)
 */
export async function validateConfig(): Promise<void> {
  const { logger } = await import('./logger.js');

  if (config.nodeEnv === 'production' && config.sessionSecret === 'development-secret-change-me') {
    logger.warn('Using default session secret in production!');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port: ${config.port}`);
  }

  logger.info({ environment: config.nodeEnv, port: config.port, redis: config.redisUrl }, 'Configuration loaded successfully');
}

export default config;
