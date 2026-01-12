import Redis from 'ioredis';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';

/**
 * Client Redis principal pour les opérations de données
 */
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

/**
 * Client Redis pour le pub/sub (nécessite une connexion séparée)
 */
export const redisPub = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const redisSub = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Gestionnaires d'événements
redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ error: err.message }, 'Redis error');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting');
});

/**
 * Initialise les connexions Redis
 */
export async function initializeRedis(): Promise<void> {
  try {
    await redis.connect();
    await redisPub.connect();
    await redisSub.connect();
    
    // Test de la connexion
    await redis.ping();
    logger.info('Redis connections established');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw error;
  }
}

/**
 * Ferme proprement les connexions Redis
 */
export async function closeRedis(): Promise<void> {
  await redis.quit();
  await redisPub.quit();
  await redisSub.quit();
  logger.info('Redis connections closed');
}

export default redis;
