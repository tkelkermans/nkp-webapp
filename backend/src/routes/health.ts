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
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Vérification de l'état du service
 *     description: Retourne l'état de santé de l'API et de ses dépendances
 *     responses:
 *       200:
 *         description: Service en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service indisponible
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
 * @openapi
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness probe pour Kubernetes
 *     description: Vérifie si le service est prêt à recevoir du trafic
 *     responses:
 *       200:
 *         description: Service prêt
 *       503:
 *         description: Service pas prêt
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
 * @openapi
 * /health/live:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness probe pour Kubernetes
 *     description: Vérifie si le service est vivant
 *     responses:
 *       200:
 *         description: Service vivant
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

export default router;
