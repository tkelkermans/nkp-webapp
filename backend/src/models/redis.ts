import Redis from 'ioredis';
import { config } from '../utils/config.js';

/**
 * Client Redis principal pour les opérations de données
 */
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
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
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
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
    console.log('✅ Redis connections established');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
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
  console.log('✅ Redis connections closed');
}

export default redis;
