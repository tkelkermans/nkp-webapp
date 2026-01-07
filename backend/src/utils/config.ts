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
 */
export function validateConfig(): void {
  if (config.nodeEnv === 'production' && config.sessionSecret === 'development-secret-change-me') {
    console.warn('⚠️  WARNING: Using default session secret in production!');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port: ${config.port}`);
  }

  console.log('✅ Configuration loaded successfully');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Redis: ${config.redisUrl}`);
}

export default config;
