import { Router, type Request, type Response } from 'express';
import redis from '../models/redis.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    redis: 'connected' | 'disconnected';
  };
}

/**
 * GET /api/health - Vérification de l'état du service
 */
router.get('/', async (_req: Request, res: Response<ApiResponse<HealthStatus>>) => {
  try {
    // Vérifier la connexion Redis
    await redis.ping();
    
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: 'connected',
      },
    };

    res.json({
      success: true,
      data: health,
    });
  } catch {
    const health: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: 'disconnected',
      },
    };

    res.status(503).json({
      success: false,
      data: health,
      error: 'Service unhealthy',
    });
  }
});

/**
 * GET /api/health/ready - Readiness probe pour Kubernetes
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await redis.ping();
    res.status(200).send('OK');
  } catch {
    res.status(503).send('Not Ready');
  }
});

/**
 * GET /api/health/live - Liveness probe pour Kubernetes
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

export default router;
